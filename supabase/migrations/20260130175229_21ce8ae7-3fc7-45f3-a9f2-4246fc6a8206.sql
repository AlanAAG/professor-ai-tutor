-- Update has_role function to also grant admin to @tetr.org users
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _role = 'admin' THEN
        -- Check if user has admin role OR has @tetr.org email
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = _user_id AND role = _role
        )
        OR EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = _user_id AND email LIKE '%@tetr.org'
        )
      ELSE
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = _user_id AND role = _role
        )
    END
$$;