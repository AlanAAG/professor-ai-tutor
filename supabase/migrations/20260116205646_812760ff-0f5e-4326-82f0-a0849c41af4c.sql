-- Fix search_path security warning for the function
DROP FUNCTION IF EXISTS public.get_sessions_cohort2(jsonb);

CREATE OR REPLACE FUNCTION public.get_sessions_cohort2(filter jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(session text, class_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    COALESCE(d.metadata->>'title', d.metadata->>'session', '') as session,
    COALESCE(d.metadata->>'class_name', '') as class_name
  FROM documents_cohort2 d
  WHERE
    d.metadata @> filter
    AND COALESCE(d.metadata->>'title', d.metadata->>'session', '') != '';
END;
$$;