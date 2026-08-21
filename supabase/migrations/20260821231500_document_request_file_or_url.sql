-- Portal: las solicitudes de archivo aceptan también una URL (PDFs grandes / carga fallida).
UPDATE public.document_requests
SET
  instructions = 'Descarga el borrador aquí, hazlo firmar por el representante legal y súbelo en PDF. Si la carga falla, pega un enlace (Drive, Dropbox, SharePoint) al PDF firmado.',
  updated_at = now()
WHERE code = 'nda_signed'
  AND status = 'open';

UPDATE public.document_requests
SET
  instructions = 'Excel/CSV/PDF de catálogos, adhesión, reportes u otros formatos vigentes. Si el archivo es grande o no carga, pega un enlace (Drive, Dropbox, SharePoint) donde esté alojado.',
  updated_at = now()
WHERE code = 'formats'
  AND status = 'open';
