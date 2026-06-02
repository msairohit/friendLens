-- ============================================================
-- Migration: Add poster_url and release_year to get_network_reviews & search_network_reviews
-- ============================================================

-- 1. Recreate get_network_reviews function with additional item fields
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
  item_poster_url TEXT,
  item_release_year INTEGER,
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
  SELECT g.review_id, g.reviewer_name, g.reviewer_pseudonym, g.is_anonymous, g.item_title, g.item_type, g.item_poster_url, g.item_release_year, g.rating, g.comment, g.depth, g.created_at, g.updated_at
  FROM (
    SELECT DISTINCT ON (r.id)
      r.id AS review_id,
      p.display_name AS reviewer_name,
      ('User_' || substring(p.id::text, 1, 4))::TEXT AS reviewer_pseudonym,
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
      i.poster_url AS item_poster_url,
      i.release_year AS item_release_year,
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
        OR (n.path_depth = 1 AND r.sharing_level >= 1) -- Friend's reviews
        OR (n.path_depth = 2 AND r.sharing_level >= 2) -- Friend of friend's reviews
      )
    ORDER BY r.id, n.path_depth ASC, r.created_at DESC
  ) g
  ORDER BY g.updated_at DESC, g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate search_network_reviews function with additional item fields
DROP FUNCTION IF EXISTS search_network_reviews(uuid, text, text);
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
  item_poster_url TEXT,
  item_release_year INTEGER,
  rating INTEGER,
  comment TEXT,
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT gnr.review_id, gnr.reviewer_name, gnr.reviewer_pseudonym, gnr.is_anonymous, gnr.item_title, gnr.item_type, gnr.item_poster_url, gnr.item_release_year, gnr.rating, gnr.comment, gnr.depth
  FROM get_network_reviews(p_user_id, 2, p_type_filter) gnr
  WHERE gnr.item_title ILIKE '%' || p_search_query || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
