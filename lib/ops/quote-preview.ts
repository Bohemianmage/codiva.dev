import {
  quoteRowToDocumentData,
  renderQuoteDocumentHtml,
  type QuoteDocumentData,
} from '@/lib/ops/quote-document';

type QuoteRow = {
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
};

type LeadContext = {
  company: string;
  name: string;
  partner_company?: string | null;
  end_client_company?: string | null;
  end_client_name?: string | null;
} | null;

type ProjectContext = {
  name: string;
  organizations?: { name?: string; contact_email?: string } | null;
} | null;

export function buildQuoteDocumentData(
  quote: QuoteRow,
  context: { lead?: LeadContext; project?: ProjectContext }
): QuoteDocumentData {
  const { lead, project } = context;

  const clientLabel =
    lead?.end_client_company ||
    lead?.company ||
    project?.organizations?.name ||
    project?.name ||
    quote.title;

  const projectName = project?.name || quote.title || `Propuesta - ${clientLabel}`;

  const clientName =
    lead?.end_client_name ||
    lead?.name ||
    project?.organizations?.name ||
    clientLabel;

  return quoteRowToDocumentData(quote, {
    clientLabel,
    projectName,
    clientName,
    partnerCompany: lead?.partner_company,
    endClientCompany: lead?.end_client_company,
    serviceDescription: quote.title,
  });
}

export function buildQuoteDocumentHtml(
  quote: QuoteRow,
  context: { lead?: LeadContext; project?: ProjectContext }
): string {
  return renderQuoteDocumentHtml(buildQuoteDocumentData(quote, context));
}
