import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge, { leadTone } from '@/components/ops/StatusBadge';
import Button from '@/components/ui/Button';
import Card, { SectionTitle } from '@/components/ui/Card';
import { DataTable, EmptyRow, THead, Td, Th, Tr } from '@/components/ui/DataTable';
import Input, { Select, Textarea } from '@/components/ui/Input';
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
          <Button
            as="a"
            href={`${opsBaseUrl()}/partner/solicitar`}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            size="sm"
          >
            {t('ops.leadsPage.partnerForm')}
          </Button>
        }
      />

      <Card as="section" className="mb-8">
        <SectionTitle className="mb-4">{t('ops.leadsPage.newTitle')}</SectionTitle>
        <ToastForm success={t('ops.leadsPage.createdToast')} action={onCreate} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="name" required placeholder={t('ops.leadsPage.nameRequired')} size="sm" />
            <Input name="email" type="email" required placeholder={t('ops.leadsPage.emailRequired')} size="sm" />
            <Input name="company" placeholder={t('ops.leadsPage.company')} size="sm" />
            <Input name="phone" placeholder={t('ops.leadsPage.phone')} size="sm" />
            <Select name="source" defaultValue="manual" size="sm">
              {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Input name="deliveryDate" type="date" size="sm" />
            <Input name="budget" type="number" step="0.01" placeholder={t('ops.leadsPage.budget')} size="sm" />
            <Input name="referenceSite" placeholder={t('ops.leadsPage.reference')} size="sm" />
          </div>
          <Textarea name="need" placeholder={t('ops.leadsPage.need')} rows={3} size="sm" />

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-700">{t('ops.leadsPage.partnerOptional')}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <Input name="partnerName" placeholder={t('ops.leadsPage.partnerName')} size="sm" />
              <Input name="partnerCompany" placeholder={t('ops.leadsPage.partnerCompany')} size="sm" />
              <Input name="partnerEmail" type="email" placeholder={t('ops.leadsPage.partnerEmail')} size="sm" />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-700">{t('ops.leadsPage.endClientOptional')}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="endClientName" placeholder={t('ops.leadsPage.endClientName')} size="sm" />
              <Input name="endClientCompany" placeholder={t('ops.leadsPage.endClientCompany')} size="sm" />
            </div>
          </div>

          <Button type="submit" size="sm">
            {t('ops.leadsPage.create')}
          </Button>
        </ToastForm>
      </Card>

      <DataTable>
        <THead>
          <tr>
            <Th>{t('ops.leadsPage.colCompany')}</Th>
            <Th>{t('ops.leadsPage.colContact')}</Th>
            <Th>{t('ops.leadsPage.colSource')}</Th>
            <Th>{t('ops.leadsPage.colStatus')}</Th>
            <Th>{t('ops.leadsPage.colDate')}</Th>
          </tr>
        </THead>
        <tbody>
          {(leads ?? []).map((lead) => (
            <Tr key={lead.id}>
              <Td>
                <Link href={`/leads/${lead.id}`} className="font-medium hover:text-codiva-primary">
                  {lead.end_client_company || lead.company || lead.partner_company || EMPTY_LABEL}
                </Link>
                {lead.partner_company && lead.company && lead.partner_company !== lead.company && (
                  <div className="text-xs text-zinc-500">
                    {t('ops.leadsPage.viaPartner', { company: lead.partner_company })}
                  </div>
                )}
              </Td>
              <Td>
                <div>{lead.name}</div>
                <div className="text-zinc-500">{lead.email}</div>
              </Td>
              <Td className="text-zinc-500">{LEAD_SOURCE_LABELS[lead.source] || lead.source}</Td>
              <Td>
                <StatusBadge label={LEAD_STATUS_LABELS[lead.status]} tone={leadTone(lead.status)} />
              </Td>
              <Td className="text-zinc-500">{formatDate(lead.created_at)}</Td>
            </Tr>
          ))}
          {!leads?.length && <EmptyRow colSpan={5}>{t('ops.leadsPage.empty')}</EmptyRow>}
        </tbody>
      </DataTable>
    </div>
  );
}
