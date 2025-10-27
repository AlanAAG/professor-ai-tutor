-- Fix the function search path security warning
DROP FUNCTION IF EXISTS public.increment_visitor_count();

CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.visitor_stats 
  SET visit_count = visit_count + 1, last_updated = now()
  WHERE id = (SELECT id FROM public.visitor_stats LIMIT 1)
  RETURNING visit_count INTO new_count;
  
  RETURN new_count;
END;
$$;