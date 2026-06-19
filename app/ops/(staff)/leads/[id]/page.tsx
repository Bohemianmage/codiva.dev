import Link from 'next/link';
import { redirect } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { leadTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import { updateLeadStatus, convertLeadToProject } from '@/lib/ops/actions';
import { LEAD_STATUS_LABELS, formatDate, formatCurrency } from '@/lib/ops/labels';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff();

  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single();
  if (!lead) redirect('/leads');

  async function onStatus(formData: FormData) {
    'use server';
    await updateLeadStatus(id, String(formData.get('status')));
  }

  async function onConvert() {
    'use server';
    const result = await convertLeadToProject(id);
    redirect(`/projects/${result.projectId}`);
  }

  return (
    <div>
      <OpsPageHeader
        title={lead.company || lead.name}
        description={`Lead desde ${lead.source}`}
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

      <form action={onStatus} className="mb-8 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Estado</label>
          <select name="status" defaultValue={lead.status} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
          Actualizar
        </button>
      </form>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Contacto</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-zinc-500">Nombre</dt><dd>{lead.name}</dd></div>
            <div><dt className="text-zinc-500">Email</dt><dd>{lead.email}</dd></div>
            <div><dt className="text-zinc-500">Teléfono</dt><dd>{lead.phone || '—'}</dd></div>
          </dl>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Proyecto</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-zinc-500">Presupuesto</dt><dd>{formatCurrency(lead.budget)}</dd></div>
            <div><dt className="text-zinc-500">Entrega deseada</dt><dd>{formatDate(lead.delivery_date)}</dd></div>
            <div><dt className="text-zinc-500">Referencia</dt><dd>{lead.reference_site || '—'}</dd></div>
          </dl>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 md:col-span-2">
          <h2 className="mb-4 font-semibold">Necesidad</h2>
          <p className="text-sm whitespace-pre-wrap">{lead.need || '—'}</p>
          {Array.isArray(lead.sections) && lead.sections.length > 0 && (
            <p className="mt-3 text-sm"><span className="text-zinc-500">Secciones:</span> {lead.sections.join(', ')}</p>
          )}
          {Array.isArray(lead.functionalities) && lead.functionalities.length > 0 && (
            <p className="mt-1 text-sm"><span className="text-zinc-500">Funcionalidades:</span> {lead.functionalities.join(', ')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
