import Link from 'next/link';
import PortalRenewalNotices from '@/components/ops/PortalRenewalNotices';
import StatusBadge, { projectTone } from '@/components/ops/StatusBadge';
import { requireProjectMember } from '@/lib/ops/auth';
import { getActiveChargeNotices } from '@/lib/ops/charges';
import {
  PROJECT_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from '@/lib/ops/labels';
import { filterClientCanvases, getPortalVisibility } from '@/lib/ops/portal-visibility';

function milestoneTone(status: string) {
  const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'neutral',
    in_progress: 'info',
    completed: 'success',
    blocked: 'danger',
  };
  return map[status] ?? 'neutral';
}

function quoteCardSubtitle(quote: {
  status: string;
  valid_until: string | null;
} | undefined) {
  if (!quote) return 'Aún no hay cotización publicada';
  if (quote.status === 'accepted') return 'Aprobada · lista para consultar';
  if (quote.status === 'rejected') return 'Rechazada';
  if (quote.status === 'expired') return 'Expirada';
  if (quote.valid_until) return `Válida hasta ${formatDate(quote.valid_until)}`;
  if (quote.status === 'sent') return 'Pendiente de tu respuesta';
  return QUOTE_STATUS_LABELS[quote.status] ?? 'Ver detalle';
}

function proposalCardCopy(kinds: string[]) {
  const set = new Set(kinds);
  const hasArch = set.has('architecture');
  const hasMvp = set.has('mvp');
  const hasProposal = set.has('proposal') || set.has('other');
  if (hasArch && hasMvp) return { title: 'Arquitectura y MVP', empty: 'Pendiente de publicar' };
  if (hasArch) return { title: 'Arquitectura', empty: 'Pendiente de publicar' };
  if (hasMvp) return { title: 'MVP / alcance', empty: 'Pendiente de publicar' };
  if (hasProposal) return { title: 'Identidad y propuesta', empty: 'Pendiente de publicar' };
  return { title: 'Propuesta', empty: 'Pendiente de publicar' };
}

export default async function PortalHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);
  const visibility = getPortalVisibility(project);

  const [{ data: milestones }, { data: quotes }, { data: canvases }, { data: docs }, { data: charges }] =
    await Promise.all([
    supabase
      .from('milestones')
      .select('id, title, status, due_date')
      .eq('project_id', project.id)
      .eq('visible_to_client', true)
      .order('sort_order'),
    visibility.showQuote
      ? supabase
          .from('quotes')
          .select('id, title, total_amount, currency, status, valid_until')
          .eq('project_id', project.id)
          .eq('visible_to_client', true)
          .in('status', ['sent', 'accepted', 'rejected', 'expired'])
          .order('version', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [] as { id: string; title: string; total_amount: number; currency: string; status: string; valid_until: string | null }[] }),
    supabase
      .from('deliverables')
      .select('id, kind')
      .eq('project_id', project.id)
      .eq('visible_to_client', true)
      .in('kind', ['architecture', 'mvp', 'proposal']),
    supabase
      .from('documents')
      .select('id, type, signed')
      .eq('project_id', project.id)
      .eq('visible_to_client', true)
      .eq('type', 'nda'),
    visibility.showCosts
      ? supabase
          .from('project_charges')
          .select('id, kind, title, amount, currency, status, due_date, notice_days, period_label')
          .eq('project_id', project.id)
          .eq('visible_to_client', true)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const nextMilestone = milestones?.find((m) => m.status !== 'completed');
  const quote =
    quotes?.find((q) => q.status === 'accepted') ??
    quotes?.find((q) => q.status === 'sent') ??
    quotes?.[0];
  const hasNda = (docs ?? []).length > 0;
  const signedNda = (docs ?? []).some((d) => d.type === 'nda' && d.signed);
  const visibleCanvases = filterClientCanvases(canvases ?? [], visibility);
  const renewalNotices = getActiveChargeNotices(charges ?? []);
  const proposalCopy = proposalCardCopy(visibleCanvases.map((c) => c.kind));

  return (
    <div className="space-y-6">
      {visibility.showCosts && <PortalRenewalNotices slug={slug} notices={renewalNotices} />}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label={PROJECT_STATUS_LABELS[project.status]} tone={projectTone(project.status)} />
          <span className="text-sm text-zinc-500">Estado del proyecto</span>
        </div>
        {project.description && <p className="mt-4 text-sm text-zinc-600">{project.description}</p>}
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">Progreso</span>
            <span>{project.progress_percent ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-codiva-primary transition-all"
              style={{ width: `${project.progress_percent ?? 0}%` }}
            />
          </div>
        </div>
        {nextMilestone && (
          <div className="mt-6 rounded-lg bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Próximo hito</p>
            <p className="mt-1 font-medium">{nextMilestone.title}</p>
            <p className="text-sm text-zinc-500">{formatDate(nextMilestone.due_date)}</p>
          </div>
        )}
      </section>

      <section
        className={`grid gap-3 sm:grid-cols-2 ${
          visibility.showQuote && visibility.showCosts
            ? 'lg:grid-cols-3 xl:grid-cols-5'
            : visibility.showQuote || visibility.showCosts
              ? 'lg:grid-cols-4'
              : 'lg:grid-cols-3'
        }`}
      >
        <Link
          href={`/p/${slug}/propuesta`}
          className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-codiva-primary/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Propuesta</p>
          <p className="mt-2 font-semibold text-zinc-900">{proposalCopy.title}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {visibleCanvases.length
              ? `${visibleCanvases.length} material(es) publicado(s)`
              : proposalCopy.empty}
          </p>
        </Link>
        {visibility.showQuote && (
          <Link
            href={`/p/${slug}/cotizacion`}
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-codiva-primary/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cotización</p>
            <p className="mt-2 font-semibold text-zinc-900">
              {quote ? formatCurrency(quote.total_amount, quote.currency) : 'Sin cotización'}
            </p>
            <p className="mt-1 text-sm text-zinc-600">{quoteCardSubtitle(quote)}</p>
          </Link>
        )}
        {visibility.showCosts && (
          <Link
            href={`/p/${slug}/pagos`}
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-codiva-primary/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pagos</p>
            <p className="mt-2 font-semibold text-zinc-900">Estado de pagos</p>
            <p className="mt-1 text-sm text-zinc-600">Desarrollo, saldo y alojamiento</p>
          </Link>
        )}
        <Link
          href={`/p/${slug}/sitio`}
          className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-codiva-primary/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tu sitio</p>
          <p className="mt-2 font-semibold text-zinc-900">
            {project.site_preview_url || project.site_production_url
              ? 'URL y accesos'
              : 'En preparación'}
          </p>
          <p className="mt-1 text-sm text-zinc-600">Preview, producción y credenciales</p>
        </Link>
        <Link
          href={`/p/${slug}/documentos`}
          className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-codiva-primary/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Documentos</p>
          <p className="mt-2 font-semibold text-zinc-900">
            {signedNda ? 'NDA firmado' : hasNda ? 'NDA disponible' : 'Bandeja lista'}
          </p>
          <p className="mt-1 text-sm text-zinc-600">Contrato, NDA y solicitudes</p>
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Hitos recientes</h2>
        <ul className="space-y-3">
          {(milestones ?? []).slice(0, 5).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{m.title}</span>
              <StatusBadge label={MILESTONE_STATUS_LABELS[m.status]} tone={milestoneTone(m.status)} />
            </li>
          ))}
          {!milestones?.length && <p className="text-sm text-zinc-500">Aún no hay hitos publicados.</p>}
        </ul>
      </section>
    </div>
  );
}
