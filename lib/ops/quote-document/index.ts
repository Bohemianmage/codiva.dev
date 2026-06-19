import { escapeHtml } from '@/utils/escapeHtml';
import { formatCurrency, formatDate, EMPTY_LABEL, DEFAULT_PROJECT_STATE } from '@/lib/ops/labels';
import { serviceTypeHeading } from '@/lib/ops/quote-document/catalog';

export type QuoteLineItem = {
  title: string;
  detail?: string;
  hours?: number | null;
  rate?: number | null;
  rateLabel?: string;
  total?: number | null;
};

export type QuoteDocumentData = {
  heading?: string;
  serviceType: string;
  clientLabel: string;
  projectName: string;
  clientName: string;
  issuedAt: string | Date;
  serviceDescription: string;
  projectState: string;
  scope: string;
  deliverables?: string;
  lineItems?: QuoteLineItem[];
  totalAmount?: number | null;
  currency?: string;
  validUntil?: string | null;
  considerations?: string;
  optionalExtras?: string;
  version?: number;
  partnerCompany?: string | null;
  endClientCompany?: string | null;
};

const BRAND = {
  primary: '#104E4E',
  text: '#18181B',
  muted: '#52525B',
  border: '#E4E4E7',
  background: '#FAFAFA',
};

function formatIssuedDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:${BRAND.text};">${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`
    )
    .join('');
}

function bulletList(text: string): string {
  const items = text
    .split(/\n/)
    .map((l) => l.replace(/^[\s•\-–]+/, '').trim())
    .filter(Boolean);
  if (!items.length) return '';
  return `<ul style="margin:0 0 16px;padding-left:20px;color:${BRAND.text};font-size:14px;line-height:1.7;">
    ${items.map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`).join('')}
  </ul>`;
}

function section(title: string, body: string): string {
  if (!body.trim()) return '';
  const isBullets = body.includes('\n•') || body.includes('\n- ') || body.startsWith('•');
  return `
    <section style="margin-top:28px;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.primary};">${escapeHtml(title)}</h2>
      ${isBullets ? bulletList(body) : paragraphs(body)}
    </section>`;
}

function lineItemsBlock(items: QuoteLineItem[], currency: string, totalAmount?: number | null): string {
  if (!items.length) return '';

  const rows = items
    .map((item, index) => {
      const detail = item.detail
        ? `<div style="margin-top:4px;font-size:13px;color:${BRAND.muted};">${escapeHtml(item.detail)}</div>`
        : '';
      const hours = item.hours != null ? `${item.hours} h` : EMPTY_LABEL;
      const rate =
        item.rate != null
          ? `${formatCurrency(item.rate, currency)}${item.rateLabel ? ` ${escapeHtml(item.rateLabel)}` : ''}`
          : EMPTY_LABEL;
      const total = item.total != null ? formatCurrency(item.total, currency) : EMPTY_LABEL;

      return `
        <tr style="border-top:1px solid ${BRAND.border};">
          <td style="padding:14px 12px;vertical-align:top;font-size:14px;color:${BRAND.text};">
            <strong>${index + 1}. ${escapeHtml(item.title)}</strong>${detail}
          </td>
          <td style="padding:14px 12px;vertical-align:top;font-size:13px;color:${BRAND.muted};white-space:nowrap;">${hours}</td>
          <td style="padding:14px 12px;vertical-align:top;font-size:13px;color:${BRAND.muted};white-space:nowrap;">${rate}</td>
          <td style="padding:14px 12px;vertical-align:top;font-size:14px;font-weight:600;color:${BRAND.text};white-space:nowrap;">${total}</td>
        </tr>`;
    })
    .join('');

  const summary =
    totalAmount != null
      ? `<div style="margin-top:16px;padding:16px 18px;border-radius:10px;background:${BRAND.background};border:1px solid ${BRAND.border};">
          <p style="margin:0;font-size:13px;color:${BRAND.muted};">Total estimado del proyecto</p>
          <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${BRAND.primary};">${formatCurrency(totalAmount, currency)}</p>
        </div>`
      : '';

  return `
    <section style="margin-top:28px;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.primary};">Estimación económica</h2>
      <div style="overflow-x:auto;border:1px solid ${BRAND.border};border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;min-width:520px;">
          <thead>
            <tr style="background:${BRAND.background};">
              <th style="padding:12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.muted};">Módulo</th>
              <th style="padding:12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.muted};">Horas</th>
              <th style="padding:12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.muted};">Tarifa</th>
              <th style="padding:12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.muted};">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${summary}
    </section>`;
}

function metaRow(label: string, value: string): string {
  return `
    <div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid ${BRAND.border};">
      <span style="min-width:150px;font-size:13px;font-weight:600;color:${BRAND.muted};">${escapeHtml(label)}</span>
      <span style="font-size:13px;color:${BRAND.text};">${escapeHtml(value)}</span>
    </div>`;
}

export function renderQuoteDocumentHtml(data: QuoteDocumentData): string {
  const currency = data.currency || 'MXN';
  const heading = serviceTypeHeading(data.serviceType, data.heading);
  const lineItems = Array.isArray(data.lineItems) ? data.lineItems : [];
  const validUntilBlock = data.validUntil
    ? metaRow('Válida hasta', formatDate(data.validUntil))
    : '';
  const partnerBlock = data.partnerCompany ? metaRow('Intermediario', data.partnerCompany) : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(data.projectName)} - Cotización Codiva</title>
  <style>@media print { body { background:#fff!important; } .page { box-shadow:none!important; margin:0!important; } }</style>
</head>
<body style="margin:0;padding:32px 16px;background:${BRAND.background};font-family:Inter,Segoe UI,Arial,sans-serif;">
  <article class="page" style="max-width:820px;margin:0 auto;background:#fff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
    <header style="background:${BRAND.primary};padding:28px 32px;color:#fff;">
      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">Codiva.dev</p>
      <p style="margin:10px 0 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;opacity:0.95;">${escapeHtml(heading)}</p>
      <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;font-weight:700;">${escapeHtml(data.clientLabel)}</h1>
      ${data.version ? `<p style="margin:8px 0 0;font-size:12px;opacity:0.85;">Versión ${data.version}</p>` : ''}
    </header>
    <div style="padding:28px 32px;">
      <div style="margin-bottom:24px;">
        ${metaRow('Proyecto', data.projectName)}
        ${metaRow('Cliente', data.clientName)}
        ${partnerBlock}
        ${data.endClientCompany ? metaRow('Cliente final', data.endClientCompany) : ''}
        ${metaRow('Desarrollador', 'Codiva.dev')}
        ${metaRow('Fecha de emisión', formatIssuedDate(data.issuedAt))}
        ${metaRow('Servicio', data.serviceDescription)}
        ${metaRow('Estado del proyecto', data.projectState)}
        ${validUntilBlock}
      </div>
      <p style="margin:0;font-size:13px;color:${BRAND.muted};">Codiva.dev - Soluciones digitales a la medida</p>
      <p style="margin:4px 0 0;font-size:13px;"><a href="mailto:hello@codiva.dev" style="color:${BRAND.primary};text-decoration:none;">hello@codiva.dev</a></p>
      ${section('Alcance del servicio', data.scope)}
      ${data.deliverables ? section('Entregables', data.deliverables) : ''}
      ${lineItemsBlock(lineItems, currency, data.totalAmount)}
      ${data.considerations ? section('Consideraciones', data.considerations) : ''}
      ${data.optionalExtras ? section('Extras opcionales (no incluidos)', data.optionalExtras) : ''}
      <footer style="margin-top:36px;padding-top:20px;border-top:1px solid ${BRAND.border};">
        <p style="margin:0;font-size:14px;color:${BRAND.text};">Atentamente,</p>
        <p style="margin:8px 0 0;font-size:14px;font-weight:600;color:${BRAND.text};">Jean Claude Martell</p>
        <p style="margin:2px 0 0;font-size:13px;color:${BRAND.muted};">Codiva.dev · j.martell@codiva.dev</p>
      </footer>
    </div>
  </article>
</body>
</html>`;
}

export function parseLineItemsJson(raw: unknown): QuoteLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const title = String(o.title || '').trim();
      if (!title) return null;
      return {
        title,
        detail: o.detail != null ? String(o.detail) : undefined,
        hours: o.hours != null ? Number(o.hours) : null,
        rate: o.rate != null ? Number(o.rate) : null,
        rateLabel: o.rateLabel != null ? String(o.rateLabel) : undefined,
        total: o.total != null ? Number(o.total) : null,
      } satisfies QuoteLineItem;
    })
    .filter(Boolean) as QuoteLineItem[];
}

export function quoteRowToDocumentData(
  quote: {
    title: string;
    scope: string | null;
    service_type?: string | null;
    project_state?: string | null;
    deliverables?: string | null;
    considerations?: string | null;
    optional_extras?: string | null;
    line_items?: unknown;
    total_amount?: number | null;
    currency?: string | null;
    valid_until?: string | null;
    version?: number;
    created_at?: string;
  },
  context: {
    clientLabel: string;
    projectName: string;
    clientName: string;
    partnerCompany?: string | null;
    endClientCompany?: string | null;
    serviceDescription?: string;
  }
): QuoteDocumentData {
  return {
    serviceType: quote.service_type || 'Web',
    clientLabel: context.clientLabel,
    projectName: context.projectName,
    clientName: context.clientName,
    issuedAt: quote.created_at || new Date().toISOString(),
    serviceDescription: context.serviceDescription || quote.title,
    projectState: quote.project_state || DEFAULT_PROJECT_STATE,
    scope: quote.scope || '',
    deliverables: quote.deliverables || '',
    lineItems: parseLineItemsJson(quote.line_items),
    totalAmount: quote.total_amount,
    currency: quote.currency || 'MXN',
    validUntil: quote.valid_until,
    considerations: quote.considerations || '',
    optionalExtras: quote.optional_extras || '',
    version: quote.version,
    partnerCompany: context.partnerCompany,
    endClientCompany: context.endClientCompany,
  };
}
