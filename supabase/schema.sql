-- ============================================================
-- FriendLens — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- ============================================================

-- ---- Profiles ----
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  friend_tag TEXT UNIQUE NOT NULL,  -- e.g. 'john#4829', generated at signup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Items (movies, series, videos, etc.) ----
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'series', 'youtube', 'video', 'product', 'restaurant')),
  external_id TEXT,
  poster_url TEXT,
  description TEXT,
  release_year INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_title ON items USING gin (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_external_id ON items(external_id);

-- ---- Reviews ----
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  link TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  sharing_level INTEGER NOT NULL DEFAULT 1 CHECK (sharing_level >= 0 AND sharing_level <= 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id) -- One review per user per item
);

CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item ON reviews(item_id);

-- ---- Connections (friend requests) ----
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id) -- Can't friend yourself
);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- ---- Sharing Permissions ----
CREATE TABLE IF NOT EXISTS sharing_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_level TEXT NOT NULL DEFAULT 'own_only' CHECK (share_level IN ('own_only', 'friends_included')),
  anonymous_friends BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, viewer_id)
);

-- ---- Review Comments ----
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Items: Anyone can read and create items
CREATE POLICY "Items are viewable by everyone" ON items
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create items" ON items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Reviews: Users can CRUD their own, read reviews visible to them
CREATE POLICY "Users can read own reviews" ON reviews
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read public reviews" ON reviews
  FOR SELECT USING (sharing_level = 4);
CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Connections: Users can see their own connections
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send connection requests" ON connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update connections they're part of" ON connections
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can delete connections they're part of" ON connections
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Sharing permissions: Users can manage their own
CREATE POLICY "Users can view own sharing permissions" ON sharing_permissions
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = viewer_id);
CREATE POLICY "Users can create own sharing permissions" ON sharing_permissions
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own sharing permissions" ON sharing_permissions
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own sharing permissions" ON sharing_permissions
  FOR DELETE USING (auth.uid() = owner_id);

-- Review comments: Authenticated users can read/create
CREATE POLICY "Authenticated users can read review comments" ON review_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create review comments" ON review_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RPC Functions for Network Queries
-- ============================================================

-- Get network reviews (friends + friends-of-friends with anonymity)
DROP FUNCTION IF EXISTS get_network_reviews(uuid, integer, text);
CREATE OR REPLACE FUNCTION get_network_reviews(
  p_user_id UUID,
  p_depth INTEGER DEFAULT 2,
  p_item_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  review_id UUID,
  reviewer_name TEXT,
  reviewer_pseudonym TEXT,
  is_anonymous BOOLEAN,
  item_title TEXT,
  item_type TEXT,
  rating INTEGER,
  comment TEXT,
  depth INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network_nodes(node_id, path_depth, referrer_id) AS (
    -- Depth 0: Current user
    SELECT p_user_id, 0, NULL::UUID
    
    UNION
    
    -- Depth 1: Friends
    SELECT 
      CASE 
        WHEN c.requester_id = p_user_id THEN c.addressee_id 
        ELSE c.requester_id 
      END,
      1,
      p_user_id
    FROM connections c
    WHERE c.status = 'accepted'
      AND (c.requester_id = p_user_id OR c.addressee_id = p_user_id)
      
    UNION
    
    -- Depth 2: Friends of Friends
    -- Only include if path_depth is 1, and the referrer (the friend) has sharing permissions set to 'friends_included' for current user
    SELECT 
      CASE 
        WHEN c2.requester_id = n.node_id THEN c2.addressee_id 
        ELSE c2.requester_id 
      END,
      2,
      n.node_id
    FROM network_nodes n
    JOIN connections c2 ON c2.status = 'accepted' AND (c2.requester_id = n.node_id OR c2.addressee_id = n.node_id)
    JOIN sharing_permissions sp ON sp.owner_id = n.node_id AND sp.viewer_id = p_user_id
    WHERE n.path_depth = 1
      AND sp.share_level = 'friends_included'
      -- Avoid back-references or duplicates
      AND (CASE WHEN c2.requester_id = n.node_id THEN c2.addressee_id ELSE c2.requester_id END) != p_user_id
      AND (CASE WHEN c2.requester_id = n.node_id THEN c2.addressee_id ELSE c2.requester_id END) != n.node_id
  )
  SELECT g.review_id, g.reviewer_name, g.reviewer_pseudonym, g.is_anonymous, g.item_title, g.item_type, g.rating, g.comment, g.depth, g.created_at, g.updated_at
  FROM (
    SELECT DISTINCT ON (r.id)
      r.id AS review_id,
      p.display_name AS reviewer_name,
      ('User_' || substring(p.id::text, 1, 4))::TEXT AS reviewer_pseudonym,
      -- Anonymous if depth is 2 AND (either review sharing_level is 2 OR intermediary friend enabled anonymous_friends)
      (n.path_depth = 2 AND (
        r.sharing_level = 2
        OR EXISTS (
          SELECT 1 FROM sharing_permissions sp2
          WHERE sp2.owner_id = n.referrer_id
            AND sp2.viewer_id = p_user_id
            AND sp2.anonymous_friends = TRUE
        )
      )) AS is_anonymous,
      i.title AS item_title,
      i.type AS item_type,
      r.rating,
      r.comment,
      n.path_depth AS depth,
      r.created_at,
      r.updated_at
    FROM reviews r
    JOIN network_nodes n ON n.node_id = r.user_id
    JOIN profiles p ON p.id = r.user_id
    JOIN items i ON i.id = r.item_id
    WHERE (p_item_type IS NULL OR i.type = p_item_type)
      AND (
        n.path_depth = 0 -- Own reviews always visible
        OR (n.path_depth = 1 AND r.sharing_level >= 1) -- Friend's reviews: direct friends, FoF, public
        OR (n.path_depth = 2 AND r.sharing_level >= 2) -- Friend of friend's reviews: FoF, public
      )
    ORDER BY r.id, n.path_depth ASC, r.created_at DESC
  ) g
  ORDER BY g.updated_at DESC, g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search network reviews
CREATE OR REPLACE FUNCTION search_network_reviews(
  p_user_id UUID,
  p_search_query TEXT,
  p_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  review_id UUID,
  reviewer_name TEXT,
  reviewer_pseudonym TEXT,
  is_anonymous BOOLEAN,
  item_title TEXT,
  item_type TEXT,
  rating INTEGER,
  comment TEXT,
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT gnr.review_id, gnr.reviewer_name, gnr.reviewer_pseudonym, gnr.is_anonymous, gnr.item_title, gnr.item_type, gnr.rating, gnr.comment, gnr.depth
  FROM get_network_reviews(p_user_id, 2, p_type_filter) gnr
  WHERE gnr.item_title ILIKE '%' || p_search_query || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

