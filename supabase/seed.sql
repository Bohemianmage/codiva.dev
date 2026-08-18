-- Codiva Ops: seed mínimo para local (NIRC + Inquilia).
-- Clientes vivos adicionales (p. ej. BYD) se crean por Ops, no por seed.
--
-- Ejecutar después de migraciones y de tener al menos un usuario staff en staff_profiles.
-- Supabase SQL Editor: pegar y ejecutar todo el archivo.
-- Local: supabase db reset (si config.toml incluye seed) o psql -f supabase/seed.sql

BEGIN;

INSERT INTO organizations (id, name, contact_email, contact_phone) VALUES
  ('a0000001-0001-4000-8000-00000000000b', 'NIRC', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (
  id, organization_id, name, slug, status, description,
  start_date, target_delivery_date, progress_percent, client_visible
) VALUES
  (
    'b0000001-0001-4000-8000-00000000000b',
    'a0000001-0001-4000-8000-00000000000b',
    'NIRC MVP Fase 1',
    'nirc',
    'active',
    E'Workforce eventual · Track A arquitectura en curso (desde 17 ago 2026).\n\nFlujo de entrada: tableta kiosk escanea QR del empleado → contrato de adhesión (solo firma el trabajador) → tableta idle; alta IMSS en paralelo. Baja IMSS y pago al check-out.\n\nSandboxes: Cincel y Stripe listos; IDSE PRO pendiente de proveedor. Políticas de montos/SDI a cargo de NIRC (no bloquean el diseño).',
    '2026-08-17', '2026-11-09', 8, true
  )
ON CONFLICT (id) DO NOTHING;

UPDATE projects SET
  portal_show_quote = false,
  portal_show_costs = false,
  status = 'active',
  start_date = '2026-08-17',
  target_delivery_date = '2026-11-09',
  progress_percent = 8,
  name = 'NIRC MVP Fase 1',
  description = E'Workforce eventual · Track A arquitectura en curso (desde 17 ago 2026).\n\nFlujo de entrada: tableta kiosk escanea QR del empleado → contrato de adhesión (solo firma el trabajador) → tableta idle; alta IMSS en paralelo. Baja IMSS y pago al check-out.\n\nSandboxes: Cincel y Stripe listos; IDSE PRO pendiente de proveedor. Políticas de montos/SDI a cargo de NIRC (no bloquean el diseño).'
WHERE id = 'b0000001-0001-4000-8000-00000000000b';

INSERT INTO leads (
  id, status, source, name, company, email, phone, need,
  partner_name, partner_company, end_client_name, end_client_company,
  budget, reference_site, converted_project_id
) VALUES
  (
    'c0000001-0001-4000-8000-00000000000b',
    'qualified', 'manual',
    'Equipo NIRC', 'NIRC', '', NULL,
    'MVP Fase 1 workforce eventual con IDSE, Cincel y Stripe Connect. 18 semanas · $980k desarrollo. Unit economics ≈ $571/jornada. Hosting Base ~$10k/mes aparte.',
    NULL, NULL, 'NIRC', 'NIRC',
    980000, NULL, 'b0000001-0001-4000-8000-00000000000b'
  )
ON CONFLICT (id) DO NOTHING;

UPDATE leads SET
  need = E'MVP Fase 1 workforce eventual con IDSE, Cincel y Stripe Connect. 18 semanas · $980k desarrollo. Unit economics ≈ $571/jornada. Hosting Base ~$10k/mes aparte.',
  budget = 980000
WHERE id = 'c0000001-0001-4000-8000-00000000000b';

INSERT INTO quotes (
  id, project_id, version, status, title, service_type, project_state,
  scope, total_amount, currency, valid_until, sent_at
) VALUES
  (
    'd0000001-0001-4000-8000-00000000000b',
    'b0000001-0001-4000-8000-00000000000b',
    1, 'sent', 'NIRC MVP Fase 1 - Completo', 'Platform',
    'Por iniciar - pendiente de aprobación formal',
    E'Paquete completo de desarrollo (18 semanas): backoffice, pool FCFS, carga masiva, QR/geocerca, entrada dura (Cincel + alta IDSE aceptada), Stripe Connect, privacy, UAT y go-live asistido.\n\nSolo software. Proveedores (Cincel/IDSE/Stripe/SMS), hosting híbrido Vercel+Railway+Neon y costo variable por jornada (~$571) van aparte.',
    980000, 'MXN', '2026-09-05', now()
  )
ON CONFLICT (id) DO NOTHING;

UPDATE quotes SET
  title = 'NIRC MVP Fase 1 - Completo',
  scope = E'Paquete completo de desarrollo (18 semanas): backoffice, pool FCFS, carga masiva, QR/geocerca, entrada dura (Cincel + alta IDSE aceptada), Stripe Connect, privacy, UAT y go-live asistido.\n\nSolo software. Proveedores (Cincel/IDSE/Stripe/SMS), hosting híbrido Vercel+Railway+Neon y costo variable por jornada (~$571) van aparte.',
  deliverables = E'• Código fuente y /docs del cliente\n• Backoffice + app personal (PWA)\n• Integraciones IDSE PRO, Cincel, Stripe Connect (adapters + sandbox)\n• Gates: sin labor sin adhesión + alta IMSS aceptada\n• Deploy híbrido documentado (Vercel UI/BFF · Railway workers · Neon Postgres)\n• UAT y capacitación go-live asistido',
  considerations = E'• Montos MXN sin IVA · vigencia 30 días\n• Hitos SPEI 25% en semanas 5 / 9 / 13 / 18\n• Unit economics ref.: ≈ $571 / persona-día; piso cliente ≈ $657\n• Cincel one-shot $60,000 ($9.60/doc) + impl. $3,200 (cliente)\n• Setup proveedores estimado ≈ $88k-$158k (medio ~$120k) → inversión inicial ≈ $1.1M con desarrollo\n• Hosting Base a presupuestar ≈ $8k-$15k/mes (punto $10k); no incluido en $980k\n• Semana 0: sandboxes IDSE/Cincel/Stripe, RP/certificados, brandbook y formatos',
  optional_extras = E'• Alternativa MVP Core: $780,000 (un RP, sin OCR avanzado, SMS→email+push)\n• Alternativa MVP + hypercare 4 sem: $1,120,000\n• Soporte mensual opcional post go-live: $45,000\n• Fuera de Fase 1: EMA/EBA, face-match, WhatsApp masivo, Temporal cloud, app nativa, multi-país, CFDI automático',
  line_items = '[
    {"title":"Hito 1 - Arranque + fundaciones","detail":"Semana 5 · Auth/RBAC, backoffice, expediente, carga masiva, consentimientos","hours":null,"rate":null,"rateLabel":"25%","total":245000},
    {"title":"Hito 2 - Pool + FCFS","detail":"Semana 9 · Scoring, convocatorias, waitlist, no-show/refill en staging","hours":null,"rate":null,"rateLabel":"25%","total":245000},
    {"title":"Hito 3 - Entrada dura","detail":"Semana 13 · QR, geocerca, Cincel, IDSE alta y gate sin Trabajando","hours":null,"rate":null,"rateLabel":"25%","total":245000},
    {"title":"Hito 4 - Salida + UAT / go-live","detail":"Semana 18 · Stripe Connect, bajas, asientos, UAT y producción","hours":null,"rate":null,"rateLabel":"25%","total":245000}
  ]'::jsonb,
  phases = '[
    {"name":"0. Kickoff","weeks":"1","deliverable":"Ambientes, sandboxes IDSE/Cincel/Stripe, catálogo RP, plantilla adhesión"},
    {"name":"1. Fundaciones","weeks":"2-5","deliverable":"Auth/RBAC, backoffice, expediente, carga masiva, consentimientos"},
    {"name":"2. Pool + FCFS","weeks":"6-9","deliverable":"Scoring, convocatorias, offers, waitlist, no-show/refill"},
    {"name":"3. Entrada dura","weeks":"10-13","deliverable":"QR, geocerca, Cincel, IDSE alta, gate"},
    {"name":"4. Salida + dinero","weeks":"14-16","deliverable":"Check-out, baja IDSE, Stripe Connect, asientos"},
    {"name":"5. UAT / go-live","weeks":"17-18","deliverable":"Pruebas E2E, capacitación, go-live asistido"}
  ]'::jsonb,
  valid_until = '2026-09-05',
  total_amount = 980000,
  currency = 'MXN',
  status = 'sent',
  visible_to_client = false
WHERE id = 'd0000001-0001-4000-8000-00000000000b';

DELETE FROM quote_access_tokens
WHERE id = 'e0000001-0001-4000-8000-00000000000b'
   OR token = 'demo-kaucho-eshop-2026';

INSERT INTO milestones (id, project_id, title, description, status, sort_order, due_date) VALUES
  ('f0000001-0001-4000-8000-00000000000b', 'b0000001-0001-4000-8000-00000000000b', 'Arquitectura — arranque', E'Inicio Track A (17 ago 2026). Decisiones: adhesión 1 firmante en tableta kiosk; baja IMSS en check-out; INE documental; IDV Cincel off. Cincel+Stripe sandbox OK; IDSE sandbox pendiente.', 'in_progress', 1, '2026-09-14'),
  ('f0000001-0001-4000-8000-00000000000c', 'b0000001-0001-4000-8000-00000000000b', 'Arquitectura — fundaciones', 'ADRs base, trazabilidad, catálogo P0 de entrada/kiosk y ownership congelado (fin Bloque I).', 'pending', 2, '2026-09-14'),
  ('f0000001-0001-4000-8000-00000000000d', 'b0000001-0001-4000-8000-00000000000b', 'Arquitectura — dominios', 'Specs por dominio (pool/FCFS, QR/kiosk, Cincel, IDSE, Stripe) + fixtures.', 'pending', 3, '2026-10-12'),
  ('f0000001-0001-4000-8000-00000000000e', 'b0000001-0001-4000-8000-00000000000b', 'Architecture freeze', 'Paquete certificado + handoff a build. Objetivo ~9 nov 2026.', 'pending', 4, '2026-11-09'),
  ('f0000001-0001-4000-8000-00000000000f', 'b0000001-0001-4000-8000-00000000000b', 'Build MVP — UAT / go-live', 'Tras freeze: implementación 18 semanas, UAT y producción (hitos de build).', 'pending', 5, '2027-03-15')
ON CONFLICT (id) DO NOTHING;

UPDATE milestones SET
  title = 'Arquitectura — fundaciones',
  description = 'ADRs base, trazabilidad, catálogo P0 de entrada/kiosk y ownership congelado (fin Bloque I).'
WHERE id = 'f0000001-0001-4000-8000-00000000000c';

UPDATE deliverables
SET description = 'Dominios, kiosk de entrada (adhesión 1 firmante), IDSE/Cincel/Stripe y flujos operativos.'
WHERE id = '92000001-0001-4000-8000-000000000001';

INSERT INTO deliverables (
  id, project_id, title, description, url, kind, sort_order, visible_to_client
) VALUES
  (
    '92000001-0001-4000-8000-000000000001',
    'b0000001-0001-4000-8000-00000000000b',
    'Arquitectura',
    'Dominios, stack, integraciones IDSE/Cincel/Stripe y flujos operativos.',
    '/client-packs/nirc/nirc-arquitectura-portal.html',
    'architecture', 1, true
  ),
  (
    '92000001-0001-4000-8000-000000000003',
    'b0000001-0001-4000-8000-00000000000b',
    'MVP Fase 1',
    'Alcance, unit economics, hosting, plan 18 semanas e inversión de desarrollo.',
    '/client-packs/nirc/mvp-fase1.html',
    'mvp', 3, false
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO documents (
  id, project_id, type, title, file_path, file_url, signed, visible_to_client, source, notes
) VALUES
  (
    '93000001-0001-4000-8000-000000000001',
    'b0000001-0001-4000-8000-00000000000b',
    'nda',
    'NDA mutuo - borrador (generado en portal)',
    'client-packs/nirc/nda-borrador.html',
    '/client-packs/nirc/nda-borrador.html',
    false, false, 'staff',
    ''
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO document_requests (
  id, project_id, code, title, description, instructions,
  expected_type, input_mode, status, required, sort_order, visible_to_client
) VALUES
  (
    '94000001-0001-4000-8000-000000000001',
    'b0000001-0001-4000-8000-00000000000b',
    'nda_signed',
    'NDA firmado',
    'Devolver el NDA mutuo firmado por el representante legal de la organización.',
    'Descarga el borrador aquí, hazlo firmar por el representante legal y súbelo en PDF.',
    'nda', 'file', 'open', true, 10, true
  ),
  (
    '94000001-0001-4000-8000-000000000002',
    'b0000001-0001-4000-8000-00000000000b',
    'brandbook',
    'Brandbook / identidad visual',
    'Logos, colores, tipografías y guía de uso de marca.',
    'PDF, Figma o ZIP con logos (SVG/PNG) y guía de marca si existe.',
    'other', 'file', 'open', true, 20, true
  ),
  (
    '94000001-0001-4000-8000-000000000003',
    'b0000001-0001-4000-8000-00000000000b',
    'process_manuals',
    'Manuales de procesos',
    'Procedimientos operativos relevantes para el producto (altas, nómina, IDSE, etc.).',
    'PDF o Word. Si son varios, un ZIP.',
    'other', 'file', 'open', true, 30, true
  ),
  (
    '94000001-0001-4000-8000-000000000004',
    'b0000001-0001-4000-8000-00000000000b',
    'formats',
    'Formatos y plantillas',
    'Plantillas, formatos y archivos de trabajo que deba reflejar el sistema.',
    'Excel/CSV/PDF de catálogos, adhesión, reportes u otros formatos vigentes.',
    'other', 'file', 'open', true, 40, true
  ),
  (
    '94000001-0001-4000-8000-000000000005',
    'b0000001-0001-4000-8000-00000000000b',
    'hosting_domain_access',
    'Accesos hosting / dominio',
    'Datos para DNS, hosting y publicación (sin pegar contraseñas en claro).',
    'Indica proveedor, dominio, URL del panel y cómo invitarnos (ej. agregar hello@codiva.dev o share de 1Password).',
    'other', 'credentials', 'open', true, 50, true
  ),
  (
    '94000001-0001-4000-8000-000000000006',
    'b0000001-0001-4000-8000-00000000000b',
    'sandbox_access',
    'Accesos sandbox (IDSE / Cincel / Stripe)',
    'Credenciales o invitaciones a ambientes de prueba para integraciones.',
    'Puedes describir el acceso aquí o adjuntar un documento en una solicitud aparte si lo prefieres.',
    'other', 'text', 'open', false, 60, true
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Inquilia (plataforma LegalTech en producción)
-- ---------------------------------------------------------------------------

INSERT INTO organizations (id, name, logo_url, contact_email, contact_phone) VALUES
  ('a0000001-0001-4000-8000-00000000000c', 'Inquilia', '/logos/inquilia.webp', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

UPDATE organizations SET
  name = 'Inquilia',
  logo_url = '/logos/inquilia.webp'
WHERE id = 'a0000001-0001-4000-8000-00000000000c';

INSERT INTO projects (
  id, organization_id, name, slug, status, description,
  start_date, target_delivery_date, progress_percent, client_visible,
  portal_show_quote, portal_show_costs,
  site_production_url
) VALUES
  (
    'b0000001-0001-4000-8000-00000000000c',
    'a0000001-0001-4000-8000-00000000000c',
    'Inquilia Plataforma LegalTech',
    'inquilia',
    'active',
    'LegalTech de arrendamiento en México: dictamen, contratos digitales, CRM multi-departamento, portales de partes, Stripe y Facturama. En producción; evolución continua.',
    '2025-06-11', NULL, 90, true,
    false, false,
    'https://inquilia.com'
  )
ON CONFLICT (id) DO NOTHING;

UPDATE projects SET
  portal_show_quote = false,
  portal_show_costs = false,
  name = 'Inquilia Plataforma LegalTech',
  description = 'LegalTech de arrendamiento en México: dictamen, contratos digitales, CRM multi-departamento, portales de partes, Stripe y Facturama. En producción; evolución continua.',
  status = 'active',
  progress_percent = 90,
  client_visible = true,
  start_date = '2025-06-11',
  site_production_url = 'https://inquilia.com'
WHERE id = 'b0000001-0001-4000-8000-00000000000c';

INSERT INTO leads (
  id, status, source, name, company, email, phone, need,
  partner_name, partner_company, end_client_name, end_client_company,
  budget, reference_site, converted_project_id
) VALUES
  (
    'c0000001-0001-4000-8000-00000000000c',
    'converted', 'manual',
    'Equipo Inquilia', 'Inquilia', '', NULL,
    'Plataforma LegalTech de arrendamiento: expediente (Ekatena, dictamen, CPS, firma, Stripe), CRM, red de asesores, finanzas, RRHH y portales. En producción desde 2025.',
    NULL, NULL, 'Inquilia', 'Inquilia',
    NULL, 'https://inquilia.com', 'b0000001-0001-4000-8000-00000000000c'
  )
ON CONFLICT (id) DO NOTHING;

UPDATE leads SET
  need = E'Plataforma LegalTech de arrendamiento: expediente (Ekatena, dictamen, CPS, firma, Stripe), CRM, red de asesores, finanzas, RRHH y portales. En producción desde 2025.',
  status = 'converted',
  converted_project_id = 'b0000001-0001-4000-8000-00000000000c',
  reference_site = 'https://inquilia.com'
WHERE id = 'c0000001-0001-4000-8000-00000000000c';

UPDATE projects SET lead_id = 'c0000001-0001-4000-8000-00000000000c'
WHERE id = 'b0000001-0001-4000-8000-00000000000c';

INSERT INTO milestones (id, project_id, title, description, status, sort_order, due_date) VALUES
  ('f0000002-0001-4000-8000-000000000001', 'b0000001-0001-4000-8000-00000000000c', 'Marketing, cotizador e intake', 'Sitio público, cotizador, portales landlord/tenant/guarantor.', 'completed', 1, '2025-08-31'),
  ('f0000002-0001-4000-8000-000000000002', 'b0000001-0001-4000-8000-00000000000c', 'CRM y red de asesores', 'Leads, clientes, BDM, calendario, analítica y portal asesores.', 'completed', 2, '2025-11-30'),
  ('f0000002-0001-4000-8000-000000000003', 'b0000001-0001-4000-8000-00000000000c', 'Expediente legal + Ekatena', 'Documentos, screening, riesgo, dictamen y plantillas.', 'completed', 3, '2026-03-31'),
  ('f0000002-0001-4000-8000-000000000004', 'b0000001-0001-4000-8000-00000000000c', 'Contratos, firma y cobro', 'CPS, arrendamiento, pagarés, acompañamiento de firma y Stripe.', 'completed', 4, '2026-05-31'),
  ('f0000002-0001-4000-8000-000000000005', 'b0000001-0001-4000-8000-00000000000c', 'Workspace multi-departamento', 'Finanzas/Facturama, RRHH, checador, TI, contenido, empleos.', 'completed', 5, '2026-07-21'),
  ('f0000002-0001-4000-8000-000000000006', 'b0000001-0001-4000-8000-00000000000c', 'Evolución continua', 'Estabilización del expediente, integraciones y operación.', 'in_progress', 6, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO deliverables (
  id, project_id, title, description, url, kind, sort_order, visible_to_client
) VALUES
  (
    '92000002-0001-4000-8000-000000000001',
    'b0000001-0001-4000-8000-00000000000c',
    'Arquitectura',
    'Hosts, expediente legal, CRM, portales, integraciones, datos y crons.',
    '/client-packs/inquilia/arquitectura-portal.html',
    'architecture', 1, true
  ),
  (
    '92000002-0001-4000-8000-000000000002',
    'b0000001-0001-4000-8000-00000000000c',
    'Arquitectura completa',
    'Inventario, avalúo de reemplazo, CI/deploy y deuda técnica. Solo staff.',
    '/client-packs/inquilia/arquitectura-completa.html',
    'architecture', 2, false
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_site_access (
  id, project_id, label, kind, url, notes, visible_to_client, sort_order
) VALUES
  ('95000002-0001-4000-8000-000000000001', 'b0000001-0001-4000-8000-00000000000c', 'Marketing / www', 'production', 'https://inquilia.com', 'Sitio público, cotizador e intake.', true, 10),
  ('95000002-0001-4000-8000-000000000002', 'b0000001-0001-4000-8000-00000000000c', 'Workspace CRM', 'cms', 'https://workspace.inquilia.com', 'Backoffice interno. No compartir sesión con portal asesores.', true, 20),
  ('95000002-0001-4000-8000-000000000003', 'b0000001-0001-4000-8000-00000000000c', 'Portal asesores', 'other', 'https://asesores.inquilia.com', 'Expediente y lealtad de la red comercial.', true, 30),
  ('95000002-0001-4000-8000-000000000004', 'b0000001-0001-4000-8000-00000000000c', 'Bolsa de empleo', 'other', 'https://career.inquilia.com', 'Vacantes públicas.', true, 40),
  ('95000002-0001-4000-8000-000000000005', 'b0000001-0001-4000-8000-00000000000c', 'Facturación', 'other', 'https://facturacion.inquilia.com', 'Portal de facturación / CSF.', true, 50)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Staff (descomenta y ajusta UUID tras crear usuario en Supabase Auth):
-- INSERT INTO staff_profiles (id, full_name, role, active)
-- VALUES ('91cfbf47-3da6-4dd7-b916-9b1460e5e1b7', 'Jean', 'admin', true)
-- ON CONFLICT (id) DO NOTHING;
