-- Staff puede leer su propio perfil (evita dependencia circular con is_staff en login)
CREATE POLICY staff_read_own_profile ON staff_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Endurecer search_path en trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Restringir ejecución pública de helpers RLS vía RPC (solo authenticated + service_role)
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.client_project_ids() FROM anon;
