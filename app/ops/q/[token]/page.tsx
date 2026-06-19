import { notFound } from 'next/navigation';
import { getPublicQuoteByToken } from '@/lib/ops/quote-tokens';
import { buildQuoteDocumentHtml } from '@/lib/ops/quote-preview';

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = await getPublicQuoteByToken(token);
  if (!payload) notFound();

  const html = buildQuoteDocumentHtml(payload.quote, {
    lead: payload.lead,
    project: payload.project,
  });

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="border-b border-zinc-200 bg-white px-4 py-3 text-center text-xs text-zinc-500">
        Propuesta comercial Codiva - solo consulta
      </div>
      <iframe
        title="Cotización Codiva"
        srcDoc={html}
        className="h-[calc(100vh-41px)] w-full border-0 bg-zinc-100"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
