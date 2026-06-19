import Link from 'next/link';
import { redirect } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { leadTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import {
  updateLeadStatus,
  updateLeadDetails,
  convertLeadToProject,
  createLeadQuote,
  sendLeadQuote,
} from '@/lib/ops/actions';
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, QUOTE_STATUS_LABELS, formatDate, formatCurrency } from '@/lib/ops/labels';
import { publicQuoteUrl } from '@/lib/ops/quote-tokens';
import { createAdminClient } from '@/lib/supabase/admin';
import OpsQuoteForm from '@/components/ops/OpsQuoteForm';

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'resumen' } = await searchParams;
  const { supabase } = await requireStaff();

  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single();
  if (!lead) redirect('/leads');

  const { data: staffList } = await supabase
    .from('staff_profiles')
    .select('id, full_name')
    .eq('active', true)
    .order('full_name');

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, title, version, status, total_amount, currency, sent_at, created_at')
    .eq('lead_id', id)
    .order('version', { ascending: false });

  const admin = createAdminClient();
  const publicLinks: Record<string, string> = {};
  for (const q of quotes ?? []) {
    if (q.status === 'sent' || q.status === 'accepted' || q.status === 'rejected') {
      const { data: tokenRow } = await admin
        .from('quote_access_tokens')
        .select('token')
        .eq('quote_id', q.id)
        .is('revoked_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tokenRow?.token) publicLinks[q.id] = publicQuoteUrl(tokenRow.token);
    }
  }

  const tabs = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'cotizaciones', label: 'Cotizaciones' },
  ];

  async function onStatus(formData: FormData) {
    'use server';
    await updateLeadStatus(id, String(formData.get('status')));
  }

  async function onUpdateDetails(formData: FormData) {
    'use server';
    await updateLeadDetails(id, formData);
  }

  async function onConvert() {
    'use server';
    const result = await convertLeadToProject(id);
    redirect(`/projects/${result.projectId}`);
  }

  const displayTitle =
    lead.end_client_company || lead.partner_company || lead.company || lead.name;

  return (
    <div>
      <OpsPageHeader
        title={displayTitle}
        description={`${LEAD_SOURCE_LABELS[lead.source] || lead.source}${lead.partner_company ? ` · vía ${lead.partner_company}` : ''}`}
        actions={
          lead.status !== 'converted' ? (
            <form action={onConvert}>
              <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
                Convertir a proyecto
              </button>
            </form>
          ) : lead.converted_project_id ? (
            <Link
              href={`/projects/${lead.converted_project_id}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium"
            >
              Ver proyecto
            </Link>
          ) : null
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <StatusBadge label={LEAD_STATUS_LABELS[lead.status]} tone={leadTone(lead.status)} />
        <span className="text-sm text-zinc-500">{formatDate(lead.created_at)}</span>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/leads/${id}?tab=${t.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? 'bg-codiva-primary text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'resumen' && (
        <div className="space-y-8">
          <form action={onStatus} className="flex items-end gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <select name="status" defaultValue={lead.status} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
              Actualizar estado
            </button>
          </form>

          <form action={onUpdateDetails} className="max-w-3xl space-y-6 rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold">Datos del lead</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" defaultValue={lead.name} placeholder="Nombre contacto" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <input name="company" defaultValue={lead.company} placeholder="Empresa" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <input name="email" type="email" defaultValue={lead.email} placeholder="Email" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <input name="phone" defaultValue={lead.phone ?? ''} placeholder="Teléfono" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Asignado a</label>
                <select name="assignedTo" defaultValue={lead.assigned_to ?? ''} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                  <option value="">Sin asignar</option>
                  {(staffList ?? []).map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name || s.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
            </div>
            <textarea name="need" rows={4} defaultValue={lead.need ?? ''} placeholder="Necesidad" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />

            <div className="border-t border-zinc-100 pt-5">
              <h3 className="mb-3 font-semibold">Intermediario (partner)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="partnerName" defaultValue={lead.partner_name ?? ''} placeholder="Nombre" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input name="partnerCompany" defaultValue={lead.partner_company ?? ''} placeholder="Empresa / agencia" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input name="partnerEmail" type="email" defaultValue={lead.partner_email ?? ''} placeholder="Email (destino de cotización)" className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-5">
              <h3 className="mb-3 font-semibold">Cliente final (opcional)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="endClientName" defaultValue={lead.end_client_name ?? ''} placeholder="Nombre" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input name="endClientCompany" defaultValue={lead.end_client_company ?? ''} placeholder="Empresa" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              </div>
            </div>

            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
              Guardar
            </button>
          </form>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-4 font-semibold">Referencia comercial</h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-zinc-500">Presupuesto referencia</dt><dd>{formatCurrency(lead.budget)}</dd></div>
                <div><dt className="text-zinc-500">Entrega deseada</dt><dd>{formatDate(lead.delivery_date)}</dd></div>
                <div><dt className="text-zinc-500">Sitio referencia</dt><dd>{lead.reference_site || '—'}</dd></div>
              </dl>
            </section>
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-4 font-semibold">Detalle solicitado</h2>
              {Array.isArray(lead.sections) && lead.sections.length > 0 && (
                <p className="text-sm"><span className="text-zinc-500">Secciones:</span> {lead.sections.join(', ')}</p>
              )}
              {Array.isArray(lead.functionalities) && lead.functionalities.length > 0 && (
                <p className="mt-2 text-sm"><span className="text-zinc-500">Funcionalidades:</span> {lead.functionalities.join(', ')}</p>
              )}
              {!lead.sections?.length && !lead.functionalities?.length && (
                <p className="text-sm text-zinc-500">Sin detalle estructurado</p>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === 'cotizaciones' && (
        <div className="space-y-6">
          <OpsQuoteForm
            title="Nueva cotización (pre-proyecto)"
            defaultTitle={`Propuesta — ${displayTitle}`}
            action={async (formData) => {
              'use server';
              await createLeadQuote(id, formData);
            }}
          />
          {(quotes ?? []).map((q) => (
            <article key={q.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{q.title} · v{q.version}</h3>
                <StatusBadge label={QUOTE_STATUS_LABELS[q.status]} tone={q.status === 'accepted' ? 'success' : 'info'} />
              </div>
              <p className="text-sm font-medium">{formatCurrency(q.total_amount, q.currency)}</p>
              {q.sent_at && <p className="mt-1 text-xs text-zinc-500">Enviada {formatDate(q.sent_at)}</p>}
              {publicLinks[q.id] && (
                <p className="mt-2 text-sm">
                  <a href={publicLinks[q.id]} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                    {publicLinks[q.id]}
                  </a>
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/quotes/${q.id}/preview`}
                  target="_blank"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                >
                  Vista previa
                </Link>
                {q.status === 'draft' && (
                  <form action={async () => { 'use server'; await sendLeadQuote(q.id, id); }}>
                    <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm text-white">
                      Enviar al intermediario / contacto
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
          {!quotes?.length && <p className="text-sm text-zinc-500">Sin cotizaciones. Crea la primera arriba.</p>}
        </div>
      )}
    </div>
  );
}
