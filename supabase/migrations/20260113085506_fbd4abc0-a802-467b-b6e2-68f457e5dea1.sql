-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can view visitor stats" ON public.visitor_stats;

-- Create a public read policy that allows anyone to view visitor stats
CREATE POLICY "Anyone can view visitor stats" 
ON public.visitor_stats 
FOR SELECT 
USING (true);