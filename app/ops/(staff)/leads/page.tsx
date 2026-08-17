import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge, { leadTone } from '@/components/ops/StatusBadge';
import { requireCapability } from '@/lib/ops/auth';
import { createLead } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { opsBaseUrl } from '@/lib/ops/host';

export default async function LeadsPage() {
  const { supabase } = await requireCapability('leads');
  const t = await getT();
  const { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, formatDate, EMPTY_LABEL } = labelsFor(t.locale);
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, company, email, status, source, partner_company, end_client_company, created_at')
    .order('created_at', { ascending: false });

  const createdMsg = t('ops.leadsPage.created');

  async function onCreate(formData: FormData) {
    'use server';
    const id = await createLead(formData);
    const { redirectWithToast } = await import('@/lib/ops/toast');
    redirectWithToast(`/leads/${id}`, createdMsg);
  }

  return (
    <div>
      <OpsPageHeader
        title={t('ops.pages.leads')}
        description={t('ops.pages.leadsDesc')}
        actions={
          <a
            href={`${opsBaseUrl()}/partner/solicitar`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            {t('ops.leadsPage.partnerForm')}
          </a>
        }
      />

      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">{t('ops.leadsPage.newTitle')}</h2>
        <ToastForm success={t('ops.leadsPage.createdToast')} action={onCreate} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input name="name" required placeholder={t('ops.leadsPage.nameRequired')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="email" type="email" required placeholder={t('ops.leadsPage.emailRequired')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="company" placeholder={t('ops.leadsPage.company')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="phone" placeholder={t('ops.leadsPage.phone')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <select name="source" defaultValue="manual" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input name="deliveryDate" type="date" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="budget" type="number" step="0.01" placeholder={t('ops.leadsPage.budget')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="referenceSite" placeholder={t('ops.leadsPage.reference')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <textarea name="need" placeholder={t('ops.leadsPage.need')} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-700">{t('ops.leadsPage.partnerOptional')}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <input name="partnerName" placeholder={t('ops.leadsPage.partnerName')} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
              <input name="partnerCompany" placeholder={t('ops.leadsPage.partnerCompany')} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
              <input name="partnerEmail" type="email" placeholder={t('ops.leadsPage.partnerEmail')} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-700">{t('ops.leadsPage.endClientOptional')}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="endClientName" placeholder={t('ops.leadsPage.endClientName')} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
              <input name="endClientCompany" placeholder={t('ops.leadsPage.endClientCompany')} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
            </div>
          </div>

          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
            {t('ops.leadsPage.create')}
          </button>
        </ToastForm>
      </section>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">{t('ops.leadsPage.colCompany')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.leadsPage.colContact')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.leadsPage.colSource')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.leadsPage.colStatus')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.leadsPage.colDate')}</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((lead) => (
              <tr key={lead.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium hover:text-codiva-primary">
                    {lead.end_client_company || lead.company || lead.partner_company || EMPTY_LABEL}
                  </Link>
                  {lead.partner_company && lead.company && lead.partner_company !== lead.company && (
                    <div className="text-xs text-zinc-500">{t('ops.leadsPage.viaPartner', { company: lead.partner_company })}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{lead.name}</div>
                  <div className="text-zinc-500">{lead.email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {LEAD_SOURCE_LABELS[lead.source] || lead.source}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={LEAD_STATUS_LABELS[lead.status]} tone={leadTone(lead.status)} />
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatDate(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leads?.length && <p className="p-6 text-sm text-zinc-500">{t('ops.leadsPage.empty')}</p>}
      </div>
    </div>
  );
}
