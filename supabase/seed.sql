-- Codiva Ops: datos de demo basados en clientes del portfolio (casesMeta + QUOTE_CATALOG)
-- Ejecutar después de migraciones y de tener al menos un usuario staff en staff_profiles.
--
-- Supabase SQL Editor: pegar y ejecutar todo el archivo.
-- Local: supabase db reset (si config.toml incluye seed) o psql -f supabase/seed.sql

BEGIN;

-- Organizaciones (clientes reales del portfolio)
INSERT INTO organizations (id, name, contact_email, contact_phone) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Inquilia', 'hola@inquilia.com', '+52 55 1000 0001'),
  ('a0000001-0001-4000-8000-000000000002', 'CD648', 'contacto@cd648.com', '+52 55 1000 0002'),
  ('a0000001-0001-4000-8000-000000000003', 'Quimialcla', 'info@quimialcla.com.mx', '+52 55 1000 0003'),
  ('a0000001-0001-4000-8000-000000000004', 'Morningstar', 'hola@morningstar.lat', '+52 55 1000 0004'),
  ('a0000001-0001-4000-8000-000000000005', 'AMIDA', 'contacto@amida.com.mx', '+52 55 1000 0005'),
  ('a0000001-0001-4000-8000-000000000006', 'Suitable', 'ops@suitable.mx', '+52 55 1000 0006'),
  ('a0000001-0001-4000-8000-000000000007', 'YOU Soluciones', 'hola@yousoluciones.com', '+52 55 1000 0007'),
  ('a0000001-0001-4000-8000-000000000008', 'RODPIM', 'proyectos@rodpim.com', NULL),
  ('a0000001-0001-4000-8000-000000000009', 'Grupo IAMSA', 'digital@iamsa.mx', NULL),
  ('a0000001-0001-4000-8000-00000000000a', 'Kaucho Quimico', 'ventas@kauchoquimico.com', NULL),
  ('a0000001-0001-4000-8000-00000000000b', 'NIRC', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Proyectos
INSERT INTO projects (
  id, organization_id, name, slug, status, description,
  start_date, target_delivery_date, progress_percent, client_visible
) VALUES
  (
    'b0000001-0001-4000-8000-000000000001',
    'a0000001-0001-4000-8000-000000000001',
    'Inquilia App',
    'inquilia',
    'active',
    'Plataforma inmobiliaria con i18n, cotizaciones y portal de clientes.',
    '2025-01-15', '2026-06-30', 68, true
  ),
  (
    'b0000001-0001-4000-8000-000000000002',
    'a0000001-0001-4000-8000-000000000002',
    'CD648 PWA',
    'cd648',
    'delivered',
    'Progressive Web App con pagos Stripe y mapas.',
    '2024-06-01', '2025-03-01', 100, true
  ),
  (
    'b0000001-0001-4000-8000-000000000003',
    'a0000001-0001-4000-8000-000000000003',
    'Quimialcla Web',
    'quimialcla',
    'delivered',
    'Sitio corporativo bilingue con catalogo de productos quimicos.',
    '2024-09-01', '2025-01-20', 100, true
  ),
  (
    'b0000001-0001-4000-8000-000000000004',
    'a0000001-0001-4000-8000-000000000004',
    'Morningstar LAT',
    'morningstar',
    'active',
    'Headless CMS con Contentful y blog editorial.',
    '2025-04-01', '2026-09-01', 45, true
  ),
  (
    'b0000001-0001-4000-8000-000000000005',
    'a0000001-0001-4000-8000-000000000005',
    'AMIDA PWA',
    'amida',
    'quoting',
    'Landing y PWA comercial para AMIDA.',
    NULL, '2026-08-01', 15, false
  ),
  (
    'b0000001-0001-4000-8000-000000000006',
    'a0000001-0001-4000-8000-000000000006',
    'Suitable Ops',
    'suitable',
    'active',
    'Panel operativo de propiedades, reservas y facturacion.',
    '2025-02-01', '2026-04-30', 82, true
  ),
  (
    'b0000001-0001-4000-8000-000000000007',
    'a0000001-0001-4000-8000-000000000007',
    'YOU Portal',
    'you-soluciones',
    'draft',
    'Portal de clientes y cotizaciones para YOU Soluciones.',
    NULL, '2026-12-01', 0, false
  ),
  (
    'b0000001-0001-4000-8000-00000000000b',
    'a0000001-0001-4000-8000-00000000000b',
    'NIRC MVP Fase 1',
    'nirc',
    'quoting',
    'Workforce eventual: pool FCFS, entrada dura (Cincel+IDSE), Stripe Connect y privacy. Alcance técnico en 18 semanas. Hosting e integraciones de terceros se presupuestan aparte.',
    NULL, '2026-12-31', 5, true
  )
ON CONFLICT (id) DO NOTHING;

UPDATE projects SET
  portal_show_quote = false,
  portal_show_costs = false,
  description = 'Workforce eventual: pool FCFS, entrada dura (Cincel+IDSE), Stripe Connect y privacy. Alcance técnico en 18 semanas. Hosting e integraciones de terceros se presupuestan aparte.'
WHERE id = 'b0000001-0001-4000-8000-00000000000b';

-- Leads
INSERT INTO leads (
  id, status, source, name, company, email, phone, need,
  partner_name, partner_company, end_client_name, end_client_company,
  budget, reference_site, converted_project_id
) VALUES
  (
    'c0000001-0001-4000-8000-000000000001',
    'new', 'referral',
    'Laura Vega', 'RODPIM', 'laura@rodpim.com', '+52 55 2000 0001',
    'PWA para gestion de flotas con mapa en tiempo real.',
    'Laura Vega', 'RODPIM', 'Transportes del Norte', 'Transportes del Norte',
    45000, 'https://rodpim.com', NULL
  ),
  (
    'c0000001-0001-4000-8000-000000000002',
    'qualified', 'manual',
    'Carlos Mendoza', 'Grupo IAMSA', 'carlos.mendoza@iamsa.mx', '+52 55 2000 0002',
    'Plataforma enterprise de reservas y operaciones regionales.',
    NULL, NULL, NULL, NULL,
    120000, NULL, NULL
  ),
  (
    'c0000001-0001-4000-8000-000000000003',
    'contacted', 'web_cotiza',
    'Ana Ruiz', 'Kaucho Quimico', 'ana@kauchoquimico.com', '+52 55 2000 0003',
    'E-commerce B2B con catalogo, cotizador y checkout.',
    NULL, NULL, NULL, NULL,
    28000, 'https://kauchoquimico.com', NULL
  ),
  (
    'c0000001-0001-4000-8000-000000000004',
    'converted', 'referral',
    'Marco BESA', 'BESA', 'marco@besa.io', '+52 55 2000 0004',
    'App movil de field service con offline-first.',
    'Agencia Norte', 'Agencia Norte', 'BESA', 'BESA',
    35000, NULL, 'b0000001-0001-4000-8000-000000000001'
  ),
  (
    'c0000001-0001-4000-8000-000000000005',
    'discarded', 'manual',
    'Pentest MX', 'Pentesting', 'audit@pentest.mx', NULL,
    'Auditoria de seguridad puntual, sin desarrollo.',
    NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
  ),
  (
    'c0000001-0001-4000-8000-00000000000b',
    'qualified', 'manual',
    'Equipo NIRC', 'NIRC', '', NULL,
    'MVP Fase 1 workforce eventual con IDSE, Cincel y Stripe Connect. 18 semanas · $980k desarrollo. Unit economics ≈ $571/jornada. Hosting Base ~$10k/mes aparte.',
    NULL, NULL, 'NIRC', 'NIRC',
    980000, NULL, 'b0000001-0001-4000-8000-00000000000b'
  )
ON CONFLICT (id) DO NOTHING;

-- Cotizaciones sobre leads
INSERT INTO quotes (
  id, lead_id, version, status, title, service_type, project_state,
  scope, deliverables, considerations, total_amount, currency, valid_until
) VALUES
  (
    'd0000001-0001-4000-8000-000000000001',
    'c0000001-0001-4000-8000-000000000001',
    1, 'draft', 'RODPIM PWA v1', 'PWA',
    'Por iniciar - pendiente de aprobación formal',
    'Mapa en vivo, roles admin/operador, alertas push y panel de rutas.',
    'Codigo fuente, despliegue en Vercel, documentacion tecnica.',
    'Integracion con GPS de terceros sujeta a API del cliente.',
    38500, 'USD', '2026-09-30'
  ),
  (
    'd0000001-0001-4000-8000-000000000002',
    'c0000001-0001-4000-8000-000000000003',
    1, 'sent', 'Kaucho E-Shop', 'E-Shop',
    'Por iniciar - pendiente de aprobación formal',
    'Catalogo, carrito, checkout Stripe y panel admin de pedidos.',
    'Sitio responsive, SEO base, capacitacion de 2 horas.',
    'Contenido de productos provisto por el cliente.',
    24200, 'USD', '2026-07-15'
  ),
  (
    'd0000001-0001-4000-8000-000000000003',
    'c0000001-0001-4000-8000-000000000002',
    1, 'draft', 'IAMSA Plataforma Regional', 'Web',
    'Por iniciar - pendiente de aprobación formal',
    'Reservas multiruta, roles por region, reportes ejecutivos.',
    'Arquitectura documentada, CI/CD, monitoreo Sentry.',
    'Alcance sujeto a validacion legal de datos de pasajeros.',
    98000, 'USD', '2026-12-31'
  )
ON CONFLICT (id) DO NOTHING;

-- Cotizaciones sobre proyectos
INSERT INTO quotes (
  id, project_id, version, status, title, service_type, project_state,
  scope, total_amount, currency, valid_until, sent_at
) VALUES
  (
    'd0000001-0001-4000-8000-000000000004',
    'b0000001-0001-4000-8000-000000000005',
    1, 'sent', 'AMIDA PWA v1', 'PWA',
    'En cotizacion - revision comercial',
    'Landing, PWA instalable, formulario de contacto y CMS basico.',
    18500, 'USD', '2026-08-01', now() - interval '3 days'
  ),
  (
    'd0000001-0001-4000-8000-000000000005',
    'b0000001-0001-4000-8000-000000000001',
    1, 'accepted', 'Inquilia Fase 2', 'App',
    'En desarrollo',
    'Modulo de reportes, exportacion PDF y roles adicionales.',
    22000, 'USD', '2026-06-01', now() - interval '45 days'
  ),
  (
    'd0000001-0001-4000-8000-00000000000b',
    'b0000001-0001-4000-8000-00000000000b',
    1, 'sent', 'NIRC MVP Fase 1 - Completo', 'Platform',
    'Por iniciar - pendiente de aprobación formal',
    E'Paquete completo de desarrollo (18 semanas): backoffice, pool FCFS, carga masiva, QR/geocerca, entrada dura (Cincel + alta IDSE aceptada), Stripe Connect, privacy, UAT y go-live asistido.\n\nSolo software. Proveedores (Cincel/IDSE/Stripe/SMS), hosting híbrido Vercel+Railway+Neon y costo variable por jornada (~$571) van aparte.',
    980000, 'MXN', '2026-09-05', now()
  )
ON CONFLICT (id) DO NOTHING;

-- Detalle comercial NIRC (alineado a docs/mvp-propuesta-fase1.md + hosting/deploy)
UPDATE quotes SET
  title = 'NIRC MVP Fase 1 - Completo',
  scope = E'Paquete completo de desarrollo (18 semanas): backoffice, pool FCFS, carga masiva, QR/geocerca, entrada dura (Cincel + alta IDSE aceptada), Stripe Connect, privacy, UAT y go-live asistido.\n\nSolo software. Proveedores (Cincel/IDSE/Stripe/SMS), hosting híbrido Vercel+Railway+Neon y costo variable por jornada (~$571) van aparte.',
  deliverables = E'• Código fuente y /docs del cliente\n• Backoffice + app personal (PWA)\n• Integraciones IDSE PRO, Cincel, Stripe Connect (adapters + sandbox)\n• Gates: sin labor sin adhesión + alta IMSS aceptada\n• Deploy híbrido documentado (Vercel UI/BFF · Railway workers · Neon Postgres)\n• UAT y capacitación go-live asistido',
  considerations = E'• Montos MXN sin IVA · vigencia 30 días\n• Hitos SPEI 25% en semanas 5 / 9 / 13 / 18\n• Unit economics ref.: ≈ $571 / persona-día; piso cliente ≈ $657\n• Cincel one-shot $60,000 ($9.60/doc) + impl. $3,200 (cliente)\n• Setup proveedores estimado ≈ $88k–$158k (medio ~$120k) → inversión inicial ≈ $1.1M con desarrollo\n• Hosting Base a presupuestar ≈ $8k–$15k/mes (punto $10k); no incluido en $980k\n• Semana 0: sandboxes IDSE/Cincel/Stripe, RP/certificados, brandbook y formatos',
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
  status = 'sent'
WHERE id = 'd0000001-0001-4000-8000-00000000000b';

UPDATE projects SET
  name = 'NIRC MVP Fase 1',
  description = 'Workforce eventual: pool FCFS, entrada dura (Cincel+IDSE), Stripe Connect y privacy. Alcance técnico en 18 semanas. Hosting e integraciones de terceros se presupuestan aparte.'
WHERE id = 'b0000001-0001-4000-8000-00000000000b';

UPDATE leads SET
  need = E'MVP Fase 1 workforce eventual con IDSE, Cincel y Stripe Connect. 18 semanas · $980k desarrollo. Unit economics ≈ $571/jornada. Hosting Base ~$10k/mes aparte.',
  budget = 980000
WHERE id = 'c0000001-0001-4000-8000-00000000000b';

-- Token publico de ejemplo (cotizacion Kaucho enviada)
-- NIRC: sin token público mientras portal_show_quote / visible_to_client estén off
INSERT INTO quote_access_tokens (id, quote_id, token, expires_at) VALUES
  (
    'e0000001-0001-4000-8000-000000000001',
    'd0000001-0001-4000-8000-000000000002',
    'demo-kaucho-eshop-2026',
    now() + interval '90 days'
  )
ON CONFLICT (id) DO NOTHING;

DELETE FROM quote_access_tokens
WHERE id = 'e0000001-0001-4000-8000-00000000000b';

-- Hitos
INSERT INTO milestones (id, project_id, title, description, status, sort_order, due_date) VALUES
  ('f0000001-0001-4000-8000-000000000001', 'b0000001-0001-4000-8000-000000000001', 'Discovery y UX', 'Workshops, wireframes y validacion de flujos.', 'completed', 1, '2025-02-28'),
  ('f0000001-0001-4000-8000-000000000002', 'b0000001-0001-4000-8000-000000000001', 'MVP en staging', 'Auth, leads y cotizador.', 'completed', 2, '2025-06-30'),
  ('f0000001-0001-4000-8000-000000000003', 'b0000001-0001-4000-8000-000000000001', 'Go-live produccion', 'Despliegue, DNS y capacitacion.', 'in_progress', 3, '2026-07-01'),
  ('f0000001-0001-4000-8000-000000000004', 'b0000001-0001-4000-8000-000000000006', 'Modulo reservas', 'Calendario, pagos y notificaciones.', 'in_progress', 1, '2026-05-15'),
  ('f0000001-0001-4000-8000-000000000005', 'b0000001-0001-4000-8000-000000000006', 'Integracion contable', 'Exportacion CFDI y conciliacion.', 'pending', 2, '2026-08-01'),
  ('f0000001-0001-4000-8000-00000000000b', 'b0000001-0001-4000-8000-00000000000b', 'Kickoff y sandboxes', 'Accesos IDSE/Cincel/Stripe, catálogo RP.', 'pending', 1, '2026-08-20'),
  ('f0000001-0001-4000-8000-00000000000c', 'b0000001-0001-4000-8000-00000000000b', 'Fundaciones demo', 'Auth, backoffice y carga masiva.', 'pending', 2, '2026-09-17'),
  ('f0000001-0001-4000-8000-00000000000d', 'b0000001-0001-4000-8000-00000000000b', 'Pool + FCFS staging', 'Convocatorias y waitlist en staging.', 'pending', 3, '2026-10-15'),
  ('f0000001-0001-4000-8000-00000000000e', 'b0000001-0001-4000-8000-00000000000b', 'Entrada dura staging', 'Cincel + IDSE alta con gate.', 'pending', 4, '2026-11-12'),
  ('f0000001-0001-4000-8000-00000000000f', 'b0000001-0001-4000-8000-00000000000b', 'UAT / go-live', 'Pruebas punta a punta y producción.', 'pending', 5, '2026-12-17')
ON CONFLICT (id) DO NOTHING;

-- Canvas NIRC (arquitectura / MVP) + NDA borrador
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

-- Cotización NIRC: existe en Ops pero oculta al portal hasta que se habilite
UPDATE quotes SET visible_to_client = false
WHERE id = 'd0000001-0001-4000-8000-00000000000b';

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
    false, true, 'staff',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- Solicitudes NIRC (habilitan slots en portal Documentos)
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

-- Inbox
INSERT INTO inbox_messages (id, name, email, message, status, lead_id) VALUES
  (
    '71000001-0001-4000-8000-000000000001',
    'Daniel Ortiz', 'daniel@example.com',
    'Hola, necesito una cotizacion para un portal de clientes con login y documentos firmados.',
    'unread', NULL
  ),
  (
    '71000001-0001-4000-8000-000000000002',
    'Sofia Linares', 'sofia@nata-m.com',
    'Tenemos un admin i18n en mente. ¿Pueden compartir tiempos y rango de inversión?',
    'unread', NULL
  ),
  (
    '71000001-0001-4000-8000-000000000003',
    'Pepe Martinez', 'pepe@automata.dev',
    'Gracias por la propuesta SPA. Revisamos internamente y regresamos la semana que entra.',
    'read', NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Tickets
INSERT INTO tickets (
  id, project_id, organization_id, title, description,
  status, priority, reporter_name, reporter_email
) VALUES
  (
    '81000001-0001-4000-8000-000000000001',
    'b0000001-0001-4000-8000-000000000001',
    'a0000001-0001-4000-8000-000000000001',
    'Error al exportar PDF en Safari',
    'El boton Exportar no responde en Safari 17 en macOS.',
    'in_progress', 'alta', 'Equipo Inquilia', 'hola@inquilia.com'
  ),
  (
    '81000001-0001-4000-8000-000000000002',
    'b0000001-0001-4000-8000-000000000002',
    'a0000001-0001-4000-8000-000000000002',
    'Webhook Stripe duplicado',
    'Se registran dos pagos por la misma orden en el panel admin.',
    'new', 'media', 'Ops CD648', 'contacto@cd648.com'
  ),
  (
    '81000001-0001-4000-8000-000000000003',
    NULL, 'a0000001-0001-4000-8000-000000000009',
    'Consulta SLA enterprise',
    'Pregunta sobre tiempos de respuesta para soporte 24/7.',
    'new', 'baja', 'Carlos Mendoza', 'carlos.mendoza@iamsa.mx'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Staff (descomenta y ajusta UUID tras crear usuario en Supabase Auth):
-- INSERT INTO staff_profiles (id, full_name, role, active)
-- VALUES ('91cfbf47-3da6-4dd7-b916-9b1460e5e1b7', 'Jean', 'admin', true)
-- ON CONFLICT (id) DO NOTHING;
