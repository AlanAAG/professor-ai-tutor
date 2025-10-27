-- Remove the public UPDATE policy on visitor_stats to prevent manipulation
-- Only the SECURITY DEFINER function increment_visitor_count() should be able to update
DROP POLICY IF EXISTS "Anyone can update visitor stats" ON public.visitor_stats;

-- Keep the SELECT policy so the counter is still visible to everyone
-- The existing policy "Anyone can view visitor stats" remains active