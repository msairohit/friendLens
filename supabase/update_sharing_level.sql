-- ============================================================
-- Migration: Add Review-Specific Sharing Levels
-- Run this in your Supabase SQL Editor to apply these changes
-- ============================================================

-- 1. Add sharing_level column to reviews
ALTER TABLE reviews 
  ADD COLUMN IF NOT EXISTS sharing_level INTEGER NOT NULL DEFAULT 1 CHECK (sharing_level >= 0 AND sharing_level <= 4);

-- 2. Migrate existing is_public data to sharing_level
-- Level 4 = Public, Level 1 = Direct Friends (default for non-public)
UPDATE reviews SET sharing_level = 4 WHERE is_public = TRUE;
UPDATE reviews SET sharing_level = 1 WHERE is_public = FALSE OR is_public IS NULL;

-- 3. Update Row Level Security (RLS) Policy for public reviews
DROP POLICY IF EXISTS "Users can read public reviews" ON reviews;
CREATE POLICY "Users can read public reviews" ON reviews
  FOR SELECT USING (sharing_level = 4);

-- 4. Recreate the get_network_reviews function to support review-specific sharing levels
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
