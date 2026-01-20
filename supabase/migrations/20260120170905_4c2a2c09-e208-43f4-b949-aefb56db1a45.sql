-- Create a function to get total message count (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_total_message_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.messages;
$$;