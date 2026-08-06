# Codiva Ops - seguridad de documentos

## Controles activos

- Bucket `ops-files` privado; acceso vía `/api/ops/file` (URL firmada 5 min)
- RLS Storage por proyecto
- SHA-256 por documento (`content_sha256`)
- Retención por proyecto (`document_retention_days`, default 365) → `retain_until` / `disposed_at`
- Bitácora de descarga (`file_access_log` + IP/UA) y `activity_log`
- Export compliance JSON por proyecto
- Escaneo antimalware opcional (ver abajo)

## Cron de retención

`GET /api/ops/cron/dispose-documents`  
Header: `Authorization: Bearer $CRON_SECRET`

Configura `CRON_SECRET` en el entorno. En Vercel Cron apunta a esa ruta diariamente.

También: staff → Documentos → **Ejecutar retención ahora**.

## Antivirus / malware (opcional)

| Opción | Costo aprox. | Notas |
|--------|----------------|-------|
| **AttachmentScanner** | ~$99/mes · 5 000 scans | Recomendado para SaaS; API simple. Env: `ATTACHMENT_SCANNER_API_KEY` |
| **VirusTotal Premium** | Quote (~$1.5k–4k+/mes; contratos anuales altos) | API pública gratis **no es uso comercial**. Env: `VIRUSTOTAL_API_KEY`; `VIRUSTOTAL_UPLOAD=true` para subir hashes desconocidos |
| **AWS GuardDuty Malware for S3** | ~$0.09/GB + ~$0.215/1k objetos (us-east-1); free tier 1 GB + 1 k/mes | Ideal si el storage pasa a S3; hoy Ops usa Supabase Storage |
| **ClamAV self-hosted** | Infra + mantenimiento | Sin fee de API; más ops |
| **MetaDefender Cloud** | Enterprise (ej. ~$55k/año en un listing AWS) | Overkill para volumen actual |

Sin clave configurada, `scan_status = skipped` y el upload se acepta (hash igual se guarda). Si el scan marca **infected**, el archivo se borra y se rechaza el upload.

Prioridad práctica Codiva: **AttachmentScanner** cuando el volumen de inbound lo justifique.
