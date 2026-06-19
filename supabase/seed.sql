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
  ('a0000001-0001-4000-8000-00000000000a', 'Kaucho Quimico', 'ventas@kauchoquimico.com', NULL)
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
  )
ON CONFLICT (id) DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;

-- Token publico de ejemplo (cotizacion Kaucho enviada)
INSERT INTO quote_access_tokens (id, quote_id, token, expires_at) VALUES
  (
    'e0000001-0001-4000-8000-000000000001',
    'd0000001-0001-4000-8000-000000000002',
    'demo-kaucho-eshop-2026',
    now() + interval '90 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Hitos
INSERT INTO milestones (id, project_id, title, description, status, sort_order, due_date) VALUES
  ('f0000001-0001-4000-8000-000000000001', 'b0000001-0001-4000-8000-000000000001', 'Discovery y UX', 'Workshops, wireframes y validacion de flujos.', 'completed', 1, '2025-02-28'),
  ('f0000001-0001-4000-8000-000000000002', 'b0000001-0001-4000-8000-000000000001', 'MVP en staging', 'Auth, leads y cotizador interno.', 'completed', 2, '2025-06-30'),
  ('f0000001-0001-4000-8000-000000000003', 'b0000001-0001-4000-8000-000000000001', 'Go-live produccion', 'Despliegue, DNS y capacitacion.', 'in_progress', 3, '2026-07-01'),
  ('f0000001-0001-4000-8000-000000000004', 'b0000001-0001-4000-8000-000000000006', 'Modulo reservas', 'Calendario, pagos y notificaciones.', 'in_progress', 1, '2026-05-15'),
  ('f0000001-0001-4000-8000-000000000005', 'b0000001-0001-4000-8000-000000000006', 'Integracion contable', 'Exportacion CFDI y conciliacion.', 'pending', 2, '2026-08-01')
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
