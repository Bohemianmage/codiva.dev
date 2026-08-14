import type { createClient } from '@/lib/supabase/server';
import { can } from '@/lib/ops/permissions';
import { careerDisciplineLabel } from '@/lib/ops/career-disciplines';
import { asProject } from '@/lib/ops/tickets';

type OpsClient = Awaited<ReturnType<typeof createClient>>;

export const INBOUND_FILTERS = ['all', 'contact', 'lead', 'ticket', 'career'] as const;
export type InboundFilter = (typeof INBOUND_FILTERS)[number];

export const INBOUND_KINDS = ['contact', 'lead', 'ticket', 'application', 'hunt'] as const;
export type InboundKind = (typeof INBOUND_KINDS)[number];

export type InboundContact = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  lead_id: string | null;
  created_at: string;
};

export type InboundItem = {
  key: string;
  kind: InboundKind;
  createdAt: string;
  title: string;
  subtitle: string;
  snippet: string;
  href: string;
  status?: string;
  contact?: InboundContact;
};

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function clip(value: string | null | undefined, max = 160): string {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function parseInboundFilter(value: string | string[] | undefined): InboundFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && (INBOUND_FILTERS as readonly string[]).includes(raw)) {
    return raw as InboundFilter;
  }
  return 'all';
}

export function inboundFiltersFor(role: string): InboundFilter[] {
  const filters: InboundFilter[] = ['all'];
  if (can(role, 'inbox')) filters.push('contact');
  if (can(role, 'leads')) filters.push('lead');
  if (can(role, 'tickets')) filters.push('ticket');
  if (can(role, 'team')) filters.push('career');
  return filters;
}

function wantsKind(filter: InboundFilter, kind: InboundKind): boolean {
  if (filter === 'all') return true;
  if (filter === 'career') return kind === 'application' || kind === 'hunt';
  return filter === kind;
}

export async function loadInboundItems({
  supabase,
  role,
  filter = 'all',
  perKind = 50,
  maxItems,
  visibleProjectIds = null,
}: {
  supabase: OpsClient;
  role: string;
  filter?: InboundFilter;
  perKind?: number;
  maxItems?: number;
  visibleProjectIds?: string[] | null;
}): Promise<InboundItem[]> {
  const showContact = can(role, 'inbox') && wantsKind(filter, 'contact');
  const showLeads = can(role, 'leads') && wantsKind(filter, 'lead');
  const showTickets = can(role, 'tickets') && wantsKind(filter, 'ticket');
  const showCareer = can(role, 'team') && (filter === 'all' || filter === 'career');
  const ticketProjectIds =
    visibleProjectIds === null
      ? null
      : visibleProjectIds.length
        ? visibleProjectIds
        : ['00000000-0000-0000-0000-000000000000'];

  const empty = { data: [] as never[] };
  const [contacts, leads, tickets, applications, hunts] = await Promise.all([
    showContact
      ? supabase
          .from('inbox_messages')
          .select('id, name, email, message, status, lead_id, created_at')
          .neq('status', 'archived')
          .order('created_at', { ascending: false })
          .limit(perKind)
      : Promise.resolve(empty),
    showLeads
      ? supabase
          .from('leads')
          .select('id, name, company, email, source, need, created_at')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(perKind)
      : Promise.resolve(empty),
    showTickets
      ? (() => {
          let query = supabase
            .from('tickets')
            .select('id, title, reporter_name, reporter_email, priority, created_at, projects(name)')
            .eq('status', 'new')
            .order('created_at', { ascending: false })
            .limit(perKind);
          if (ticketProjectIds) query = query.in('project_id', ticketProjectIds);
          return query;
        })()
      : Promise.resolve(empty),
    showCareer
      ? supabase
          .from('ops_job_applications')
          .select('id, full_name, email, discipline, created_at, ops_job_postings(title, slug)')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(perKind)
      : Promise.resolve(empty),
    showCareer
      ? supabase
          .from('ops_hunt_reports')
          .select('id, full_name, email, title, page_url, assessment_attempt_id, created_at')
          .eq('review_status', 'open')
          .order('created_at', { ascending: false })
          .limit(perKind)
      : Promise.resolve(empty),
  ]);

  const items: InboundItem[] = [];

  for (const row of contacts.data ?? []) {
    items.push({
      key: `contact:${row.id}`,
      kind: 'contact',
      createdAt: row.created_at,
      title: row.name,
      subtitle: row.email,
      snippet: clip(row.message),
      href: '/inbox',
      status: row.status,
      contact: row,
    });
  }

  for (const row of leads.data ?? []) {
    items.push({
      key: `lead:${row.id}`,
      kind: 'lead',
      createdAt: row.created_at,
      title: row.company || row.name,
      subtitle: row.email,
      snippet: clip(row.need),
      href: `/leads/${row.id}`,
    });
  }

  for (const row of tickets.data ?? []) {
    const project = asProject(row.projects);
    items.push({
      key: `ticket:${row.id}`,
      kind: 'ticket',
      createdAt: row.created_at,
      title: row.title,
      subtitle: project?.name || row.reporter_name || row.reporter_email,
      snippet: clip(row.reporter_email),
      href: `/tickets/${row.id}`,
      status: row.priority,
    });
  }

  for (const row of applications.data ?? []) {
    const posting = firstRelated(row.ops_job_postings);
    const discipline = careerDisciplineLabel(row.discipline);
    items.push({
      key: `application:${row.id}`,
      kind: 'application',
      createdAt: row.created_at,
      title: row.full_name,
      subtitle: row.email,
      snippet: clip([posting?.title, discipline].filter(Boolean).join(' · ')),
      href: '/team?tab=bolsa',
    });
  }

  for (const row of hunts.data ?? []) {
    items.push({
      key: `hunt:${row.id}`,
      kind: 'hunt',
      createdAt: row.created_at,
      title: row.full_name,
      subtitle: row.email,
      snippet: clip(row.title),
      href: row.assessment_attempt_id
        ? `/team/intentos/${row.assessment_attempt_id}`
        : '/team?tab=bolsa',
    });
  }

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return typeof maxItems === 'number' ? items.slice(0, maxItems) : items;
}
