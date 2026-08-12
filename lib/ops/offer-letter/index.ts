import { escapeHtml } from '@/utils/escapeHtml';
import { formatCurrency } from '@/lib/ops/labels';
import { BRAND_EMAIL, CODIVA_BRAND } from '@/lib/brand';

const BRAND = BRAND_EMAIL;
const FONT_BODY = `'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif`;
const FONT_DISPLAY = `'Plus Jakarta Sans', Inter, system-ui, sans-serif`;
const SITE = CODIVA_BRAND.urls.site.replace(/\/$/, '');
const LOGO_URL = `${SITE}/logo.svg`;

export const WORK_MODALITY_LABELS: Record<string, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
};

export const OPS_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  dev: 'Desarrollador',
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  declined: 'Declinada',
  withdrawn: 'Retirada',
};

export type OfferLetterData = {
  fullName: string;
  email?: string | null;
  positionTitle: string;
  opsRole?: string;
  monthlyCompensation: number;
  currency?: string;
  workModality?: string;
  startDate?: string | Date | null;
  validUntil?: string | Date | null;
  responsibilities?: string;
  terms?: string;
  issuedAt?: string | Date;
  signerName?: string;
  signerTitle?: string;
  signerEmail?: string;
};

export const DEFAULT_RESPONSIBILITIES = `Coordinar el avance de proyectos de software a la medida y productos digitales asignados.
Ser el punto de contacto operativo entre cliente, diseño, desarrollo y dirección de Codiva.
Dar seguimiento a alcance, tiempos, riesgos, dependencias y entregables en las herramientas del equipo Codiva.dev.
Facilitar alineaciones, revisiones y demos con el cliente o stakeholders del proyecto.
Mantener claridad de prioridades, comunicar bloqueos a tiempo y proponer siguientes pasos.
Gestionar expectativas y cambios de alcance, escalando a dirección cuando afecten tiempos o costo.
Apoyar la documentación operativa del proyecto (hitos, tickets, entregables y estatus).
Participar en estimación, priorización y planeación de entregas cuando se requiera.
Colaborar en la mejora de procesos operativos del estudio (rituales, plantillas, handoffs).
Otras actividades afines al rol de Project Manager que Codiva asigne según las necesidades del estudio y de los proyectos.`;

export const DEFAULT_TERMS = `La compensación se paga de forma mensual en la moneda indicada, previo acuerdo de facturación o esquema de pago vigente.
La colaboración inicia en la fecha acordada, sujeta a la aceptación escrita de esta carta oferta.
Las responsabilidades listadas son enunciativas y no limitativas: describen el núcleo del rol, sin excluir tareas razonablemente relacionadas con la operación de proyectos de Codiva.dev.
El alcance concreto de proyectos, carga y prioridades puede variar conforme a la operación del estudio; cambios materiales de rol o compensación se acordarán por escrito.
Cualquiera de las partes podrá dar por terminada la relación con aviso razonable, conforme a lo que se pacte por escrito.
Esta carta no constituye por sí sola un contrato laboral definitivo; formaliza la intención de incorporar a la persona al equipo de operaciones de Codiva.dev bajo los términos aquí descritos.`;

function formatLongDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value.includes('T') ? value : `${value}T12:00:00`) : value;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${BRAND.text};">${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`
    )
    .join('');
}

function bulletList(text: string): string {
  const items = text
    .split(/\n/)
    .map((l) => l.replace(/^[\s•\-–]+/, '').trim())
    .filter(Boolean);
  if (!items.length) return '';
  return `<ul style="margin:0 0 16px;padding-left:20px;font-family:${FONT_BODY};color:${BRAND.text};font-size:15px;line-height:1.7;">
    ${items.map((item) => `<li style="margin-bottom:8px;">${escapeHtml(item)}</li>`).join('')}
  </ul>`;
}

function section(title: string, body: string, asBullets = false): string {
  if (!body.trim()) return '';
  return `
    <section style="margin-top:32px;">
      <h2 style="margin:0 0 14px;font-family:${FONT_DISPLAY};font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primary};">${escapeHtml(title)}</h2>
      ${asBullets ? bulletList(body) : paragraphs(body)}
    </section>`;
}

function metaRow(label: string, value: string): string {
  return `
    <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid ${BRAND.border};">
      <span style="min-width:170px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${BRAND.muted};">${escapeHtml(label)}</span>
      <span style="font-family:${FONT_BODY};font-size:14px;font-weight:500;color:${BRAND.text};">${escapeHtml(value)}</span>
    </div>`;
}

/** Wordmark oficial: Codiva (#18181B) + .dev (primary #104E4E). */
function brandWordmarkHtml(): string {
  return `<span style="font-family:${FONT_DISPLAY};font-size:22px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${BRAND.text};">Codiva<span style="font-weight:500;color:${BRAND.primary};">.dev</span></span>`;
}

export function offerLetterFilename(fullName: string) {
  const safe = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `Carta-Oferta-Codiva-${safe || 'Candidato'}.html`;
}

export function renderOfferLetterHtml(data: OfferLetterData): string {
  const currency = data.currency || 'USD';
  const modality = WORK_MODALITY_LABELS[data.workModality || 'remote'] || data.workModality || 'Remoto';
  const issuedAt = data.issuedAt ? formatLongDate(data.issuedAt) : formatLongDate(new Date());
  const startLabel = data.startDate ? formatLongDate(data.startDate) : 'Por acordar';
  const validLabel = data.validUntil ? formatLongDate(data.validUntil) : null;
  const compensation = formatCurrency(data.monthlyCompensation, currency);
  const responsibilities = (data.responsibilities || DEFAULT_RESPONSIBILITIES).trim();
  const terms = (data.terms || DEFAULT_TERMS).trim();
  const signerName = data.signerName || 'Jean Claude Martell';
  const signerTitle = data.signerTitle || 'Codiva.dev';
  const signerEmail = data.signerEmail || 'j.martell@codiva.dev';
  const emailRow = data.email ? metaRow('Correo', data.email) : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Carta oferta - ${escapeHtml(data.fullName)} · Codiva.dev</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet"/>
  <style>
    @media print {
      body { background:#fff!important; padding:0!important; }
      .page { box-shadow:none!important; margin:0!important; border:none!important; border-radius:0!important; }
    }
  </style>
</head>
<body style="margin:0;padding:32px 16px;background:${BRAND.background};font-family:${FONT_BODY};color:${BRAND.text};">
  <article class="page" style="max-width:820px;margin:0 auto;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(24,24,27,0.06);">
    <header style="background:${BRAND.card};padding:28px 36px 28px;border-bottom:1px solid ${BRAND.border};">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
        <img src="${LOGO_URL}" alt="Codiva" width="40" height="40" style="display:block;border:0;outline:none;"/>
        ${brandWordmarkHtml()}
      </div>
      <p style="margin:0;font-family:${FONT_DISPLAY};font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.primary};">Carta oferta</p>
      <h1 style="margin:12px 0 0;font-family:${FONT_DISPLAY};font-size:30px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${BRAND.text};">${escapeHtml(data.fullName)}</h1>
      <p style="margin:10px 0 0;font-family:${FONT_BODY};font-size:15px;font-weight:500;color:${BRAND.textMuted};">${escapeHtml(data.positionTitle)}</p>
    </header>

    <div style="padding:32px 36px 40px;">
      <p style="margin:0 0 20px;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${BRAND.textMuted};">
        Ciudad de México, a ${escapeHtml(issuedAt)}.
      </p>
      <p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${BRAND.text};">
        Estimado/a <strong style="font-weight:600;">${escapeHtml(data.fullName)}</strong>:
      </p>
      <p style="margin:0 0 24px;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${BRAND.text};">
        En <span style="font-family:${FONT_DISPLAY};font-weight:700;letter-spacing:-0.02em;color:${BRAND.text};">Codiva<span style="font-weight:500;color:${BRAND.primary};">.dev</span></span>
        nos da gusto ofrecerte incorporarte a nuestro equipo de operaciones
        como <strong style="font-weight:600;">${escapeHtml(data.positionTitle)}</strong>. Esta carta formaliza los términos
        principales de la oferta.
      </p>

      <div style="margin:0 0 8px;padding:4px 18px;border-radius:12px;background:${BRAND.background};border:1px solid ${BRAND.border};">
        ${metaRow('Puesto', data.positionTitle)}
        ${emailRow}
        ${metaRow('Compensación mensual', compensation)}
        ${metaRow('Modalidad', modality)}
        ${metaRow('Fecha de inicio', startLabel)}
        ${metaRow('Fecha de emisión', issuedAt)}
        ${validLabel ? metaRow('Vigencia de la oferta', validLabel) : ''}
      </div>

      ${section('Responsabilidades', responsibilities, true)}
      <p style="margin:8px 0 0;font-family:${FONT_BODY};font-size:13px;line-height:1.6;color:${BRAND.muted};">
        Lista enunciativa del núcleo del rol; no es exhaustiva ni limita actividades afines que Codiva asigne.
      </p>
      ${section('Condiciones', terms, false)}

      <section style="margin-top:32px;">
        <h2 style="margin:0 0 14px;font-family:${FONT_DISPLAY};font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primary};">Aceptación</h2>
        <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${BRAND.text};">
          Si estás de acuerdo con estos términos, responde por escrito a esta carta (correo o documento firmado)
          indicando tu aceptación. Con ello daremos inicio a tu alta en el equipo de operaciones de Codiva.dev.
        </p>
      </section>

      <div style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:32px;">
        <div>
          <p style="margin:0 0 52px;font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">Por Codiva.dev</p>
          <div style="border-top:1px solid ${BRAND.border};padding-top:12px;">
            <p style="margin:0;font-family:${FONT_DISPLAY};font-size:15px;font-weight:700;letter-spacing:-0.01em;color:${BRAND.text};">${escapeHtml(signerName)}</p>
            <p style="margin:4px 0 0;font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">${escapeHtml(signerTitle)}</p>
            <p style="margin:2px 0 0;font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">${escapeHtml(signerEmail)}</p>
          </div>
        </div>
        <div>
          <p style="margin:0 0 52px;font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">Acepto la oferta</p>
          <div style="border-top:1px solid ${BRAND.border};padding-top:12px;">
            <p style="margin:0;font-family:${FONT_DISPLAY};font-size:15px;font-weight:700;letter-spacing:-0.01em;color:${BRAND.text};">${escapeHtml(data.fullName)}</p>
            <p style="margin:4px 0 0;font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">Nombre y firma</p>
            <p style="margin:2px 0 0;font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">Fecha: _______________</p>
          </div>
        </div>
      </div>

      <footer style="margin-top:40px;padding-top:20px;border-top:1px solid ${BRAND.border};display:flex;align-items:center;gap:12px;">
        <img src="${LOGO_URL}" alt="" width="28" height="28" style="display:block;border:0;outline:none;flex-shrink:0;"/>
        <div>
          <p style="margin:0;font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">${escapeHtml(CODIVA_BRAND.tagline)}</p>
          <p style="margin:4px 0 0;font-family:${FONT_BODY};font-size:13px;">
            <a href="mailto:${CODIVA_BRAND.urls.email}" style="color:${BRAND.primary};text-decoration:none;">${CODIVA_BRAND.urls.email}</a>
            · <a href="${CODIVA_BRAND.urls.site}" style="color:${BRAND.primary};text-decoration:none;">${SITE.replace(/^https?:\/\//, '')}</a>
          </p>
        </div>
      </footer>
    </div>
  </article>
</body>
</html>`;
}

export function rowToOfferLetterData(row: {
  full_name: string;
  email?: string | null;
  position_title: string;
  ops_role?: string | null;
  monthly_compensation: number | string;
  currency?: string | null;
  work_modality?: string | null;
  start_date?: string | null;
  valid_until?: string | null;
  responsibilities?: string | null;
  terms?: string | null;
  issued_at?: string | null;
}): OfferLetterData {
  return {
    fullName: row.full_name,
    email: row.email,
    positionTitle: row.position_title,
    opsRole: row.ops_role || undefined,
    monthlyCompensation: Number(row.monthly_compensation),
    currency: row.currency || 'USD',
    workModality: row.work_modality || 'remote',
    startDate: row.start_date,
    validUntil: row.valid_until,
    responsibilities: row.responsibilities || undefined,
    terms: row.terms || undefined,
    issuedAt: row.issued_at || undefined,
  };
}
