-- NIRC: formatos y plantillas entregados como carpeta Drive (carga de archivo fallida en portal).
UPDATE public.document_requests
SET
  status = 'fulfilled',
  response_text = 'https://drive.google.com/drive/folders/1nX8hcOzMxfOl_jzPdTkVKV8y8Qw6Dejh?usp=share_link',
  fulfilled_at = COALESCE(fulfilled_at, now()),
  updated_at = now()
WHERE id = '94000001-0001-4000-8000-000000000004'
  AND status = 'open';
