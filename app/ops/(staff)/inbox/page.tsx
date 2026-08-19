import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge from '@/components/ops/StatusBadge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { TabLink, Tabs } from '@/components/ui/Tabs';
import { listVisibleProjectIds, requireCapability } from '@/lib/ops/auth';
import { updateInboxStatus, updateInboxLane, convertInboxToLead, deleteInboxMessage } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import {
  inboundFiltersFor,
  loadInboundItems,
  parseInboundFilter,
  type InboundFilter,
  type InboundKind,
} from '@/lib/ops/inbound';
import { INBOX_LANES, type InboxLane } from '@/lib/ops/inbox-lane';
import { getT } from '@/i18n/locale';

function kindTone(kind: InboundKind): 'info' | 'warning' | 'danger' | 'success' | 'neutral' {
  if (kind === 'contact') return 'info';
  if (kind === 'lead') return 'warning';
  if (kind === 'ticket') return 'danger';
  if (kind === 'application') return 'success';
  return 'warning';
}

function laneTone(lane: InboxLane): 'info' | 'warning' | 'danger' | 'success' | 'neutral' {
  if (lane === 'real') return 'success';
  if (lane === 'test') return 'warning';
  return 'neutral';
}

function filterHref(kind: InboundFilter) {
  return kind === 'all' ? '/inbox' : `/inbox?kind=${kind}`;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string | string[] }>;
}) {
  const { supabase, user, staff } = await requireCapability('inbox');
  const params = await searchParams;
  const t = await getT();
  const { INBOX_STATUS_LABELS, formatDate } = labelsFor(t.locale);
  const filter = parseInboundFilter(params.kind);
  const availableFilters = inboundFiltersFor(staff);
  const activeFilter = availableFilters.includes(filter) ? filter : 'all';
  const items = await loadInboundItems({
    supabase,
    permissions: staff,
    filter: activeFilter,
    visibleProjectIds: await listVisibleProjectIds(supabase, user.id, staff),
  });

  const filterLabel: Record<InboundFilter, string> = {
    all: t('ops.inbox.filterAll'),
    contact: t('ops.inbox.filterContact'),
    test: t('ops.inbox.filterTest'),
    other: t('ops.inbox.filterOther'),
    lead: t('ops.inbox.filterLeads'),
    ticket: t('ops.inbox.filterTickets'),
    career: t('ops.inbox.filterCareer'),
  };
  const laneLabel: Record<InboxLane, string> = {
    real: t('ops.inbox.laneReal'),
    test: t('ops.inbox.laneTest'),
    other: t('ops.inbox.laneOther'),
  };
  const kindLabel: Record<InboundKind, string> = {
    contact: t('ops.inbox.kindContact'),
    lead: t('ops.inbox.kindLead'),
    ticket: t('ops.inbox.kindTicket'),
    application: t('ops.inbox.kindApplication'),
    hunt: t('ops.inbox.kindHunt'),
  };

  return (
    <div>
      <OpsPageHeader title={t('ops.pages.inbox')} description={t('ops.pages.inboxDesc')} />
      <Tabs variant="pills">
        {availableFilters.map((kind) => (
          <TabLink key={kind} href={filterHref(kind)} active={activeFilter === kind} variant="pills">
            {filterLabel[kind]}
          </TabLink>
        ))}
      </Tabs>
      <div className="space-y-4">
        {items.map((item) => {
          const contact = item.contact;
          if (contact) {
            const messageId = contact.id;
            const convertSuccess = t('ops.inbox.convertSuccess');

            async function onStatus(formData: FormData) {
              'use server';
              await updateInboxStatus(messageId, String(formData.get('status')));
            }

            async function onLane(formData: FormData) {
              'use server';
              await updateInboxLane(messageId, String(formData.get('lane')));
            }

            async function onConvertToLead() {
              'use server';
              const result = await convertInboxToLead(messageId);
              const { redirectWithToast } = await import('@/lib/ops/toast');
              redirectWithToast(`/leads/${result.leadId}`, convertSuccess);
            }

            async function onDelete() {
              'use server';
              await deleteInboxMessage(messageId);
            }

            return (
              <Card key={item.key} as="article">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <StatusBadge label={kindLabel.contact} tone={kindTone('contact')} />
                      <StatusBadge label={laneLabel[contact.lane]} tone={laneTone(contact.lane)} />
                      <h2 className="font-semibold">{contact.name}</h2>
                    </div>
                    <p className="text-sm text-zinc-500">
                      {contact.email} · {formatDate(contact.created_at)}
                    </p>
                  </div>
                  <StatusBadge
                    label={INBOX_STATUS_LABELS[contact.status]}
                    tone={contact.status === 'unread' ? 'info' : 'neutral'}
                  />
                </div>
                <p className="text-sm whitespace-pre-wrap text-zinc-700">{contact.message}</p>
                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <ToastForm success={t('ops.inbox.saved')} action={onStatus} className="flex items-end gap-2">
                    <select
                      name="status"
                      defaultValue={contact.status}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-codiva-primary focus:ring-2 focus:ring-codiva-primary/20"
                    >
                      {Object.entries(INBOX_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary" size="xs">
                      {t('ops.inbox.save')}
                    </Button>
                  </ToastForm>
                  <ToastForm success={t('ops.inbox.laneSaved')} action={onLane} className="flex items-end gap-2">
                    <select
                      name="lane"
                      defaultValue={contact.lane}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-codiva-primary focus:ring-2 focus:ring-codiva-primary/20"
                    >
                      {INBOX_LANES.map((lane) => (
                        <option key={lane} value={lane}>
                          {laneLabel[lane]}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary" size="xs">
                      {t('ops.inbox.save')}
                    </Button>
                  </ToastForm>
                  {contact.lead_id ? (
                    <Button as={Link} href={`/leads/${contact.lead_id}`} variant="secondary" size="xs">
                      {t('ops.inbox.viewLead')}
                    </Button>
                  ) : contact.lane === 'real' ? (
                    <ToastForm success={t('ops.inbox.converted')} action={onConvertToLead}>
                      <Button type="submit" size="xs">
                        {t('ops.inbox.convertLead')}
                      </Button>
                    </ToastForm>
                  ) : null}
                  <ToastForm
                    success={t('ops.inbox.deleted')}
                    confirmTitle={t('ops.inbox.delete')}
                    confirmLabel={t('ops.inbox.delete')}
                    confirmMessage={t('ops.inbox.deleteConfirm')}
                    action={onDelete}
                  >
                    <Button type="submit" variant="danger" size="xs">
                      {t('ops.inbox.delete')}
                    </Button>
                  </ToastForm>
                </div>
              </Card>
            );
          }

          return (
            <Card key={item.key} as="article">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <StatusBadge label={kindLabel[item.kind]} tone={kindTone(item.kind)} />
                    <h2 className="font-semibold">{item.title}</h2>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {item.subtitle} · {formatDate(item.createdAt)}
                  </p>
                  {item.snippet ? (
                    <p className="mt-2 text-sm text-zinc-700">{item.snippet}</p>
                  ) : null}
                </div>
                <Button as={Link} href={item.href} variant="secondary" size="xs">
                  {t('ops.inbox.open')}
                </Button>
              </div>
            </Card>
          );
        })}
        {!items.length && <EmptyState>{t('ops.inbox.empty')}</EmptyState>}
      </div>
    </div>
  );
}
