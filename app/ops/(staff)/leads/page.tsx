import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { leadTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import { LEAD_STATUS_LABELS, formatDate } from '@/lib/ops/labels';

export default async function LeadsPage() {
  const { supabase } = await requireStaff();
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, company, email, status, source, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <OpsPageHeader title="Leads" description="Solicitudes de cotización y contacto comercial" />
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((lead) => (
              <tr key={lead.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium hover:text-codiva-primary">
                    {lead.company || '—'}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div>{lead.name}</div>
                  <div className="text-zinc-500">{lead.email}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={LEAD_STATUS_LABELS[lead.status]} tone={leadTone(lead.status)} />
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatDate(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leads?.length && <p className="p-6 text-sm text-zinc-500">No hay leads registrados</p>}
      </div>
    </div>
  );
}
