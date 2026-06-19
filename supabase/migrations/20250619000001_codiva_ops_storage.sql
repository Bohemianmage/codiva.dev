-- Codiva Ops — bucket y políticas de Storage
-- Requiere el schema storage de Supabase (no aplica en Postgres plano).
-- Si falla aquí, crea el bucket manualmente: Dashboard → Storage → New bucket → ops-files (privado, 10 MB).

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ops-files', 'ops-files', false, 10485760)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY staff_storage_all ON storage.objects FOR ALL
  USING (bucket_id = 'ops-files' AND public.is_staff())
  WITH CHECK (bucket_id = 'ops-files' AND public.is_staff());

CREATE POLICY client_storage_read ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ops-files'
    AND auth.uid() IS NOT NULL
  );
