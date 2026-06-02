-- ============================================================
-- FriendLens — Database Seed Script
-- Run this in your Supabase SQL Editor to seed the database with user1, user2, user3.
-- ============================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Clean existing records (Optional, uncomment if needed)
-- DELETE FROM auth.users WHERE email IN ('user1@friendlens.com', 'user2@friendlens.com', 'user3@friendlens.com');

-- 2. Insert test users into auth.users (if they don't exist)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'user1@friendlens.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"user1","display_name":"User One"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'user2@friendlens.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"user2","display_name":"User Two"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'user3@friendlens.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"user3","display_name":"User Three"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- 2b. Link identities so the users can log in
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    '{"sub": "11111111-1111-1111-1111-111111111111", "email": "user1@friendlens.com"}'::jsonb,
    'email',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    '{"sub": "22222222-2222-2222-2222-222222222222", "email": "user2@friendlens.com"}'::jsonb,
    'email',
    '22222222-2222-2222-2222-222222222222',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '{"sub": "33333333-3333-3333-3333-333333333333", "email": "user3@friendlens.com"}'::jsonb,
    'email',
    '33333333-3333-3333-3333-333333333333',
    now(),
    now(),
    now()
  )
ON CONFLICT (provider, provider_id) DO NOTHING;

-- 3. Insert profiles (will auto-link to auth.users if profiles table triggers exist, but insert explicitly for safety)
INSERT INTO profiles (id, username, display_name, email, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'user1', 'User One', 'user1@friendlens.com', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'user2', 'User Two', 'user2@friendlens.com', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'user3', 'User Three', 'user3@friendlens.com', now(), now())
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username, display_name = EXCLUDED.display_name, email = EXCLUDED.email;

-- 4. Insert mock items
INSERT INTO items (id, title, type, release_year, description, poster_url)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Inception', 'movie', 2010, 'A thief who steals corporate secrets through the use of dream-sharing technology.', 'https://image.tmdb.org/t/p/w500/o0xxnvXh5vJU5r4eHM1I4ccRi5q.jpg'),
  ('a2222222-2222-2222-2222-222222222222', 'Breaking Bad', 'series', 2008, 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine.', 'https://image.tmdb.org/t/p/w500/ztkUQvmg16736eJvQ6of2Zqd64g.jpg'),
  ('a3333333-3333-3333-3333-333333333333', 'MKBHD - Apple Vision Pro Review', 'youtube', 2024, 'Full hands-on review of the Apple Vision Pro after a week of real world use.', 'https://img.youtube.com/vi/dtp6b76pMak/hqdefault.jpg')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert connections
-- user2 <-> user1 (accepted)
-- user2 <-> user3 (accepted)
INSERT INTO connections (requester_id, addressee_id, status, created_at, updated_at)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'accepted', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'accepted', now(), now())
ON CONFLICT (requester_id, addressee_id) DO UPDATE SET status = 'accepted';

-- 6. Insert sharing permissions
-- user2 grants access to user1 (friends_included, anonymous_friends = true)
-- user2 grants access to user3 (friends_included, anonymous_friends = false)
INSERT INTO sharing_permissions (owner_id, viewer_id, share_level, anonymous_friends, created_at, updated_at)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'friends_included', TRUE, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'friends_included', FALSE, now(), now())
ON CONFLICT (owner_id, viewer_id) DO UPDATE SET share_level = EXCLUDED.share_level, anonymous_friends = EXCLUDED.anonymous_friends;

-- 7. Insert mock reviews
INSERT INTO reviews (user_id, item_id, rating, comment, is_public, sharing_level, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 9, 'One of the best sci-fi movies ever made. The visuals and soundtrack are legendary.', TRUE, 4, now() - INTERVAL '3 days', now() - INTERVAL '3 days'),
  ('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 10, 'Absolutely perfect television. From acting to writing, it is flawless.', TRUE, 4, now() - INTERVAL '2 days', now() - INTERVAL '2 days'),
  ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 8, 'Excellent review, very objective about the comfort and battery limitations.', TRUE, 4, now() - INTERVAL '1 day', now() - INTERVAL '1 day'),
  -- Let's add cross reviews to make it richer
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 10, 'Masterpiece of cinema. Nolan at his peak.', TRUE, 4, now() - INTERVAL '12 hours', now() - INTERVAL '12 hours')
ON CONFLICT (user_id, item_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment;

-- 8. Replace get_network_reviews function to support depth 2 & sharing permissions
-- ============================================================
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
