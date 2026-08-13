import { parseLineItemsJson, parsePhasesJson } from '@/lib/ops/quote-document';

export function portalQuoteDocumentPath(slug: string, quoteId: string): string {
  return `/p/${slug}/cotizacion/${quoteId}`;
}

export function isLegacyQuotePackDocument(doc: {
  type?: string | null;
  title?: string | null;
  file_url?: string | null;
  file_path?: string | null;
}): boolean {
  if (doc.type !== 'proposal_pdf') return false;
  const blob = `${doc.title ?? ''} ${doc.file_url ?? ''} ${doc.file_path ?? ''}`.toLowerCase();
  return /cotizaci[oó]n/.test(blob) || blob.includes('cotizacion');
}

export { parseLineItemsJson, parsePhasesJson };
