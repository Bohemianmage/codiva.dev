import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { requireAdminStaff } from '@/lib/ops/auth';
import { getAssessmentCatalog } from '@/lib/careers/assessments/catalog';
import { parseAnswers } from '@/lib/careers/assessments/server';
import { reviewRowsForAttempt, scoreAnswers } from '@/lib/careers/assessments/engine';
import { EMPTY_LABEL, formatDate } from '@/lib/ops/labels';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const EVENT_LABELS: Record<string, string> = {
  started: 'Empezó',
  resumed: 'Reanudó',
  question_viewed: 'Vio la pregunta',
  answered: 'Respondió',
  window_blur: 'Salió de la ventana',
  window_focus: 'Volvió a la ventana',
  submitted: 'Envió la prueba',
  timed_out: 'Se acabó el tiempo',
};

function formatDuration(ms: number | null | undefined) {
  if (!ms || ms < 0) return '—';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} min ${s}s` : `${s}s`;
}

function optionLabel(
  options: { key: string; label: string }[],
  keys: string[]
) {
  if (!keys.length) return 'Sin respuesta';
  return keys
    .map((key) => options.find((o) => o.key === key)?.label || key)
    .join(' · ');
}

export default async function AssessmentAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdminStaff();

  const { data: attempt } = await supabase
    .from('ops_job_assessment_attempts')
    .select(
      'id, job_posting_id, catalog_key, full_name, email, status, attempt_number, started_at, completed_at, expires_at, time_limit_sec, question_ids, option_orders, answers, score_correct, score_total, score_pct, passed, duration_ms, blur_count, timezone, user_agent'
    )
    .eq('id', id)
    .maybeSingle();

  if (!attempt) notFound();

  const [{ data: posting }, { data: events }, { data: application }] = await Promise.all([
    supabase.from('ops_job_postings').select('id, title, slug').eq('id', attempt.job_posting_id).maybeSingle(),
    supabase
      .from('ops_job_assessment_events')
      .select('id, event_type, question_id, payload, created_at')
      .eq('attempt_id', attempt.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('ops_job_applications')
      .select('id')
      .eq('assessment_attempt_id', attempt.id)
      .maybeSingle(),
  ]);

  const catalog = getAssessmentCatalog(attempt.catalog_key);
  const answers = parseAnswers(attempt.answers);
  const questionIds = (attempt.question_ids as string[]) || [];
  const scored = catalog
    ? scoreAnswers(catalog, questionIds, answers)
    : { byQuestion: {} as Record<string, boolean>, pct: attempt.score_pct ?? 0 };
  const review = catalog
    ? reviewRowsForAttempt(catalog, questionIds, answers, scored.byQuestion)
    : [];

  const timeOnQuestion = new Map<string, number>();
  let lastView: { id: string; at: number } | null = null;
  for (const event of events ?? []) {
    const at = new Date(event.created_at).getTime();
    if (event.event_type === 'question_viewed' && event.question_id) {
      if (lastView) {
        timeOnQuestion.set(lastView.id, (timeOnQuestion.get(lastView.id) || 0) + (at - lastView.at));
      }
      lastView = { id: event.question_id, at };
    }
  }
  if (lastView && attempt.completed_at) {
    timeOnQuestion.set(
      lastView.id,
      (timeOnQuestion.get(lastView.id) || 0) + (new Date(attempt.completed_at).getTime() - lastView.at)
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <OpsPageHeader
        title={attempt.full_name}
        description="Detalle de la prueba para reclutamiento: respuestas, tiempos y avance."
      />
      <p className="text-sm">
        <Link href="/team?tab=bolsa" className="text-codiva-primary hover:underline">
          ← Bolsa de trabajo
        </Link>
        {posting ? (
          <>
            {' · '}
            <Link href={`/team/vacantes/${posting.id}`} className="text-codiva-primary hover:underline">
              {posting.title}
            </Link>
          </>
        ) : null}
      </p>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Resultado</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {attempt.passed ? 'Aprobó' : attempt.status === 'completed' ? 'No aprobó' : attempt.status}
            {attempt.score_pct != null ? ` · ${attempt.score_pct}%` : ''}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {attempt.score_correct ?? '—'}/{attempt.score_total ?? '—'} pts · intento {attempt.attempt_number}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tiempo</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{formatDuration(attempt.duration_ms)}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Límite {Math.round((attempt.time_limit_sec || 0) / 60)} min · {formatDate(attempt.started_at)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Contexto</p>
          <p className="mt-1 text-sm text-zinc-800">{attempt.email}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {attempt.timezone || 'Zona no reportada'}
            {attempt.blur_count ? ` · ${attempt.blur_count} salidas de ventana` : ' · sin salidas de ventana'}
            {application?.id ? ' · ya postuló' : ' · no ha postulado'}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Respuestas</h2>
        {!review.length ? (
          <p className="text-sm text-zinc-500">No hay catálogo para reconstruir las preguntas.</p>
        ) : (
          <ol className="space-y-3">
            {review.map((row, index) => (
              <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-codiva-primary">
                    {index + 1}. {row.competency}
                  </p>
                  <span className={`text-xs font-semibold ${row.ok ? 'text-codiva-primary' : 'text-red-700'}`}>
                    {row.ok ? 'Correcta' : 'Incorrecta'} · {formatDuration(timeOnQuestion.get(row.id) || 0)}
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-900">{row.prompt}</p>
                <p className="mt-2 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-800">Dio: </span>
                  {optionLabel(row.options, row.given)}
                </p>
                {!row.ok ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    <span className="font-medium text-zinc-800">Esperado: </span>
                    {optionLabel(row.options, row.correct)}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Línea de tiempo</h2>
        {!events?.length ? (
          <p className="text-sm text-zinc-500">Sin eventos registrados.</p>
        ) : (
          <ol className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span className="w-36 shrink-0 tabular-nums text-zinc-400">
                  {new Date(event.created_at).toLocaleString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="text-zinc-800">
                  {EVENT_LABELS[event.event_type] || event.event_type}
                  {event.question_id ? ` · ${event.question_id}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
        {attempt.user_agent ? (
          <p className="text-xs text-zinc-400">Agente: {attempt.user_agent}</p>
        ) : null}
        {!attempt.timezone && !attempt.user_agent ? (
          <p className="text-xs text-zinc-400">{EMPTY_LABEL}</p>
        ) : null}
      </section>
    </div>
  );
}
