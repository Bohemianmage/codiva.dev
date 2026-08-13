import { escapeHtml } from '@/utils/escapeHtml';
import { BRAND_EMAIL, brandWordmarkHtml } from '@/lib/brand';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAssessmentCatalog } from '@/lib/careers/assessments/catalog';
import { parseAnswers } from '@/lib/careers/assessments/server';
import { reviewRowsForAttempt, scoreAnswers } from '@/lib/careers/assessments/engine';
import { matchedSeedCountsForDiscipline } from '@/lib/careers/hunt/match';
import {
  huntConsiderationLabel,
  huntDifficultyLabel,
  scoreHuntReports,
  type HuntConsideration,
} from '@/lib/careers/hunt/score';
import { summarizeHuntTrail, type HuntTrailQuality } from '@/lib/careers/hunt/trail';
import { huntSeedById } from '@/lib/careers/hunt/seeds';
import {
  CAREER_DISCIPLINE_LABELS,
  disciplineFromCatalogKey,
  type CareerDiscipline,
} from '@/lib/ops/career-disciplines';

const BRAND = BRAND_EMAIL;
const FONT_BODY = `'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif`;
const FONT_DISPLAY = `'Plus Jakarta Sans', Inter, system-ui, sans-serif`;

export type RecruitingFinding = {
  title: string;
  pageUrl: string;
  description: string;
  expected: string | null;
  counts: boolean;
  difficultyLabel: string | null;
  evidenceCount: number;
  createdAt: string;
};

export type RecruitingDossier = {
  attemptId: string;
  fullName: string;
  email: string;
  vacancy: string;
  craft: string | null;
  status: string;
  passed: boolean | null;
  scorePct: number | null;
  scoreCorrect: number | null;
  scoreTotal: number | null;
  attemptNumber: number;
  durationLabel: string;
  blurCount: number;
  startedAt: string;
  completedAt: string | null;
  applied: boolean;
  consideration: HuntConsideration;
  considerationLabel: string;
  craftHits: number;
  findingsTotal: number;
  competencies: { name: string; ok: boolean }[];
  findings: RecruitingFinding[];
  trail: HuntTrailQuality;
};

export type RecruitingPipelineRow = {
  attemptId: string;
  fullName: string;
  email: string;
  vacancy: string;
  craft: string | null;
  passed: boolean | null;
  scorePct: number | null;
  consideration: HuntConsideration;
  considerationLabel: string;
  craftHits: number;
  browsedSite: boolean;
  applied: boolean;
  completedAt: string | null;
  startedAt: string;
};

function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms < 0) return '—';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} min ${s}s` : `${s}s`;
}

function slugName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'candidato';
}

export function recruitingReportFilename(kind: 'candidato' | 'pipeline', name: string, ext: 'html' | 'pdf'): string {
  const day = new Date().toISOString().slice(0, 10);
  return `codiva-${kind}-${slugName(name)}-${day}.${ext}`;
}

export async function loadRecruitingDossier(attemptId: string): Promise<RecruitingDossier | null> {
  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from('ops_job_assessment_attempts')
    .select(
      'id, job_posting_id, catalog_key, full_name, email, status, attempt_number, started_at, completed_at, time_limit_sec, question_ids, answers, score_correct, score_total, score_pct, passed, duration_ms, blur_count'
    )
    .eq('id', attemptId)
    .maybeSingle();
  if (!attempt) return null;

  const discipline = disciplineFromCatalogKey(attempt.catalog_key);
  const [
    { data: posting },
    { data: application },
    { data: huntByAttempt },
    { data: huntByEmail },
    { data: huntTrail },
  ] = await Promise.all([
    admin.from('ops_job_postings').select('title').eq('id', attempt.job_posting_id).maybeSingle(),
    admin.from('ops_job_applications').select('id').eq('assessment_attempt_id', attempt.id).maybeSingle(),
    admin
      .from('ops_hunt_reports')
      .select('id, page_url, title, description, expected, matched_seed_id, evidence_paths, created_at')
      .eq('assessment_attempt_id', attempt.id)
      .order('created_at', { ascending: false }),
    admin
      .from('ops_hunt_reports')
      .select('id, page_url, title, description, expected, matched_seed_id, evidence_paths, created_at')
      .ilike('email', attempt.email)
      .order('created_at', { ascending: false })
      .limit(40),
    admin
      .from('ops_hunt_events')
      .select('event_type, path, host, referrer, created_at')
      .eq('assessment_attempt_id', attempt.id)
      .order('created_at', { ascending: true })
      .limit(200),
  ]);

  const byId = new Map<string, NonNullable<typeof huntByAttempt>[number]>();
  for (const row of [...(huntByAttempt ?? []), ...(huntByEmail ?? [])]) byId.set(row.id, row);
  const huntReports = [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const score = scoreHuntReports(huntReports, discipline);
  const catalog = getAssessmentCatalog(attempt.catalog_key);
  const answers = parseAnswers(attempt.answers);
  const questionIds = (attempt.question_ids as string[]) || [];
  const scored = catalog
    ? scoreAnswers(catalog, questionIds, answers)
    : { byQuestion: {} as Record<string, boolean> };
  const review = catalog ? reviewRowsForAttempt(catalog, questionIds, answers, scored.byQuestion) : [];

  const findings: RecruitingFinding[] = huntReports.map((row) => {
    const seed = row.matched_seed_id ? huntSeedById(row.matched_seed_id) : null;
    const counts = discipline ? matchedSeedCountsForDiscipline(row.matched_seed_id, discipline) : Boolean(seed);
    return {
      title: row.title,
      pageUrl: row.page_url,
      description: String(row.description || '').slice(0, 1400),
      expected: row.expected,
      counts,
      difficultyLabel: counts && seed ? huntDifficultyLabel(seed.difficulty, 'es') : null,
      evidenceCount: Array.isArray(row.evidence_paths) ? row.evidence_paths.length : 0,
      createdAt: row.created_at,
    };
  });

  const trail = summarizeHuntTrail({
    passedAt: attempt.completed_at,
    discipline,
    events: huntTrail ?? [],
    reports: huntReports,
  });

  return {
    attemptId: attempt.id,
    fullName: attempt.full_name,
    email: attempt.email,
    vacancy: posting?.title || 'Vacante',
    craft: discipline ? CAREER_DISCIPLINE_LABELS[discipline as CareerDiscipline] : null,
    status: attempt.status,
    passed: attempt.passed,
    scorePct: attempt.score_pct,
    scoreCorrect: attempt.score_correct,
    scoreTotal: attempt.score_total,
    attemptNumber: attempt.attempt_number,
    durationLabel: formatDuration(attempt.duration_ms),
    blurCount: attempt.blur_count || 0,
    startedAt: attempt.started_at,
    completedAt: attempt.completed_at,
    applied: Boolean(application?.id),
    consideration: score.consideration,
    considerationLabel: huntConsiderationLabel(score.consideration, 'es'),
    craftHits: score.craftHits,
    findingsTotal: huntReports.length,
    competencies: review.map((row) => ({ name: row.competency, ok: row.ok })),
    findings,
    trail,
  };
}

export async function loadRecruitingPipeline(jobPostingId?: string): Promise<{
  vacancy: string;
  rows: RecruitingPipelineRow[];
}> {
  const admin = createAdminClient();
  let attemptQuery = admin
    .from('ops_job_assessment_attempts')
    .select(
      'id, job_posting_id, catalog_key, full_name, email, status, score_pct, passed, started_at, completed_at'
    )
    .order('created_at', { ascending: false })
    .limit(80);
  if (jobPostingId) attemptQuery = attemptQuery.eq('job_posting_id', jobPostingId);
  const { data: attempts } = await attemptQuery;

  const postingIds = [...new Set((attempts ?? []).map((row) => row.job_posting_id))];
  const emails = [...new Set((attempts ?? []).map((row) => row.email.toLowerCase()))];
  const attemptIds = (attempts ?? []).map((row) => row.id);

  const [{ data: postings }, { data: applications }, { data: huntReports }, { data: huntEvents }] = await Promise.all([
    postingIds.length
      ? admin.from('ops_job_postings').select('id, title').in('id', postingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    attemptIds.length
      ? admin.from('ops_job_applications').select('assessment_attempt_id').in('assessment_attempt_id', attemptIds)
      : Promise.resolve({ data: [] as { assessment_attempt_id: string }[] }),
    emails.length
      ? admin
          .from('ops_hunt_reports')
          .select('email, matched_seed_id, page_url, created_at')
          .limit(400)
      : Promise.resolve({ data: [] as { email: string; matched_seed_id: string | null; page_url: string; created_at: string }[] }),
    attemptIds.length
      ? admin
          .from('ops_hunt_events')
          .select('assessment_attempt_id, event_type, path, host, referrer, created_at')
          .in('assessment_attempt_id', attemptIds)
          .limit(800)
      : Promise.resolve({
          data: [] as {
            assessment_attempt_id: string;
            event_type: string;
            path: string;
            host: string | null;
            referrer: string | null;
            created_at: string;
          }[],
        }),
  ]);

  const postingTitle = new Map((postings ?? []).map((row) => [row.id, row.title]));
  const applied = new Set((applications ?? []).map((row) => row.assessment_attempt_id));
  const eventsByAttempt = new Map<string, NonNullable<typeof huntEvents>>();
  for (const event of huntEvents ?? []) {
    const list = eventsByAttempt.get(event.assessment_attempt_id) ?? [];
    list.push(event);
    eventsByAttempt.set(event.assessment_attempt_id, list);
  }

  const rows: RecruitingPipelineRow[] = (attempts ?? []).map((row) => {
    const discipline = disciplineFromCatalogKey(row.catalog_key);
    const reports = (huntReports ?? []).filter((item) => item.email.toLowerCase() === row.email.toLowerCase());
    const score = scoreHuntReports(reports, discipline);
    const trail = summarizeHuntTrail({
      passedAt: row.completed_at,
      discipline,
      events: eventsByAttempt.get(row.id) ?? [],
      reports,
    });
    return {
      attemptId: row.id,
      fullName: row.full_name,
      email: row.email,
      vacancy: postingTitle.get(row.job_posting_id) || 'Vacante',
      craft: discipline ? CAREER_DISCIPLINE_LABELS[discipline] : null,
      passed: row.passed,
      scorePct: row.score_pct,
      consideration: score.consideration,
      considerationLabel: huntConsiderationLabel(score.consideration, 'es'),
      craftHits: score.craftHits,
      browsedSite: trail.browsedSite,
      applied: applied.has(row.id),
      completedAt: row.completed_at,
      startedAt: row.started_at,
    };
  });

  const vacancy =
    jobPostingId && rows[0]?.vacancy
      ? rows[0].vacancy
      : postingIds.length === 1
        ? postingTitle.get(postingIds[0]!) || 'Bolsa Codiva.dev'
        : 'Bolsa Codiva.dev';

  return { vacancy, rows };
}

function trailCopy(trail: HuntTrailQuality): string {
  const parts: string[] = [];
  if (trail.formOnly) parts.push('Poco recorrido: casi solo el formulario de la prueba.');
  else if (trail.browsedSite) parts.push(`Recorrió el sitio (${trail.uniquePages} páginas distintas).`);
  else parts.push('Aún no hay páginas en el mapa de cacería.');
  if (trail.visitedFeed) parts.push('Pasó por el feed JSON.');
  if (trail.visitedMarketing) parts.push('También visitó el sitio público.');
  if (trail.msToFirstCraft != null) {
    parts.push(`Primer hallazgo del oficio a los ${formatDuration(trail.msToFirstCraft)}.`);
  } else {
    parts.push('Todavía no hay hallazgo del oficio.');
  }
  return parts.join(' ');
}

function resultCopy(d: RecruitingDossier): string {
  if (d.passed) return `Aprobó criterio${d.scorePct != null ? ` · ${d.scorePct}%` : ''}`;
  if (d.status === 'completed') return `No aprobó criterio${d.scorePct != null ? ` · ${d.scorePct}%` : ''}`;
  if (d.status === 'started') return 'Criterio en curso';
  return d.status;
}

export function renderRecruitingDossierHtml(d: RecruitingDossier): string {
  const competencies = d.competencies
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};">${escapeHtml(row.name)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-weight:600;color:${row.ok ? BRAND.primary : '#B42318'};">${row.ok ? 'Correcta' : 'Incorrecta'}</td>
        </tr>`
    )
    .join('');

  const findings = d.findings.length
    ? d.findings
        .map((row) => {
          const badge = row.counts
            ? `Cuenta para el oficio${row.difficultyLabel ? ` · dificultad ${escapeHtml(row.difficultyLabel)}` : ''}`
            : 'No cuenta para la prueba';
          return `<article style="margin:0 0 16px;padding:14px 16px;border:1px solid ${BRAND.border};border-radius:12px;">
            <p style="margin:0 0 6px;font-weight:600;">${escapeHtml(row.title)}</p>
            <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};">${escapeHtml(row.pageUrl)} · ${escapeHtml(formatWhen(row.createdAt))}${row.evidenceCount ? ` · ${row.evidenceCount} captura(s)` : ''}</p>
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${row.counts ? BRAND.primary : BRAND.muted};">${badge}</p>
            <p style="margin:0;font-size:14px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(row.description)}</p>
            ${row.expected ? `<p style="margin:8px 0 0;font-size:13px;color:${BRAND.muted};"><strong>Esperado:</strong> ${escapeHtml(row.expected)}</p>` : ''}
          </article>`;
        })
        .join('')
    : `<p style="color:${BRAND.muted};">Todavía no reportó hallazgos.</p>`;

  return documentShell({
    title: `Candidato · ${d.fullName}`,
    heading: d.fullName,
    kicker: 'Reporte de evaluación · Confidencial',
    body: `
      <p class="lede">Paquete para reclutamiento externo. Resume criterio, cacería y recorrido. No incluye el banco de preguntas ni las semillas internas.</p>
      <table class="meta" role="presentation">
        <tr><th>Correo</th><td>${escapeHtml(d.email)}</td></tr>
        <tr><th>Vacante</th><td>${escapeHtml(d.vacancy)}</td></tr>
        <tr><th>Oficio</th><td>${escapeHtml(d.craft || '—')}</td></tr>
        <tr><th>Criterio</th><td>${escapeHtml(resultCopy(d))}${d.scoreCorrect != null ? ` · ${d.scoreCorrect}/${d.scoreTotal} pts` : ''} · intento ${d.attemptNumber}</td></tr>
        <tr><th>Tiempo</th><td>${escapeHtml(d.durationLabel)} · ${d.blurCount ? `${d.blurCount} salidas de ventana` : 'sin salidas de ventana'}</td></tr>
        <tr><th>Fechas</th><td>Inicio ${escapeHtml(formatWhen(d.startedAt))}${d.completedAt ? ` · cierre ${escapeHtml(formatWhen(d.completedAt))}` : ''}</td></tr>
        <tr><th>Cacería</th><td>${d.craftHits} hallazgo(s) del oficio · señal ${escapeHtml(d.considerationLabel)} · ${d.findingsTotal} reporte(s) en total</td></tr>
        <tr><th>CV</th><td>${d.applied ? 'Ya postuló' : 'No ha postulado'}</td></tr>
      </table>
      <h2>Cómo cazó</h2>
      <p>${escapeHtml(trailCopy(d.trail))}</p>
      <h2>Competencias (criterio)</h2>
      <p class="note">Solo el resultado por competencia. El texto de las preguntas no se comparte.</p>
      ${
        competencies
          ? `<table class="grid"><thead><tr><th>Competencia</th><th>Resultado</th></tr></thead><tbody>${competencies}</tbody></table>`
          : `<p style="color:${BRAND.muted};">Sin catálogo para reconstruir competencias.</p>`
      }
      <h2>Hallazgos reportados</h2>
      <p class="note">En las palabras del candidato. Solo cuenta un hallazgo alineado al oficio. Lo demás queda visible y no suma.</p>
      ${findings}
    `,
  });
}

export function renderRecruitingPipelineHtml(input: { vacancy: string; rows: RecruitingPipelineRow[] }): string {
  const bodyRows = input.rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.fullName)}<div class="sub">${escapeHtml(row.email)}</div></td>
        <td>${escapeHtml(row.craft || '—')}<div class="sub">${escapeHtml(row.vacancy)}</div></td>
        <td>${row.passed ? 'Aprobó' : row.passed === false ? 'No' : '—'} ${row.scorePct != null ? `${row.scorePct}%` : ''}</td>
        <td>${row.craftHits} · ${escapeHtml(row.considerationLabel)}</td>
        <td>${row.browsedSite ? 'Sitio' : 'Formulario'}</td>
        <td>${row.applied ? 'Sí' : 'No'}</td>
        <td>${escapeHtml(formatWhen(row.completedAt || row.startedAt))}</td>
      </tr>`
    )
    .join('');

  return documentShell({
    title: `Pipeline · ${input.vacancy}`,
    heading: 'Pipeline de evaluación',
    kicker: 'Reporte de reclutamiento · Confidencial',
    body: `
      <p class="lede">Vista para agencia externa. ${escapeHtml(input.vacancy)}. ${input.rows.length} intento(s). Sin banco de preguntas ni semillas internas.</p>
      ${
        input.rows.length
          ? `<table class="grid">
              <thead>
                <tr>
                  <th>Candidato</th>
                  <th>Oficio</th>
                  <th>Criterio</th>
                  <th>Cacería</th>
                  <th>Recorrido</th>
                  <th>CV</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>${bodyRows}</tbody>
            </table>`
          : `<p style="color:${BRAND.muted};">Todavía no hay intentos.</p>`
      }
    `,
  });
}

function documentShell(input: { title: string; heading: string; kicker: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(input.title)} · Codiva.dev</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet"/>
  <style>
    body { margin:0; padding:32px 20px; background:${BRAND.background}; color:${BRAND.text}; font-family:${FONT_BODY}; }
    .page { max-width:800px; margin:0 auto; background:${BRAND.card}; border:1px solid ${BRAND.border}; border-radius:16px; padding:32px 36px 28px; }
    .kicker { margin:0 0 6px; font-size:11px; letter-spacing:.14em; text-transform:uppercase; font-weight:700; color:${BRAND.primary}; }
    h1 { margin:0 0 8px; font-family:${FONT_DISPLAY}; font-size:26px; letter-spacing:-.02em; }
    h2 { margin:28px 0 8px; font-family:${FONT_DISPLAY}; font-size:16px; }
    .lede, .note { font-size:13px; line-height:1.55; color:${BRAND.muted}; }
    .lede { margin:0 0 20px; }
    .note { margin:0 0 12px; }
    .meta { width:100%; border-collapse:collapse; margin:0 0 8px; }
    .meta th { text-align:left; width:120px; padding:7px 0; color:${BRAND.muted}; font-size:12px; font-weight:600; vertical-align:top; }
    .meta td { padding:7px 0; font-size:14px; }
    .grid { width:100%; border-collapse:collapse; font-size:13px; }
    .grid th { text-align:left; padding:8px 10px; background:#F3F6F6; border-bottom:1px solid ${BRAND.border}; font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:${BRAND.muted}; }
    .grid td { padding:8px 10px; border-bottom:1px solid ${BRAND.border}; vertical-align:top; }
    .sub { font-size:11px; color:${BRAND.muted}; margin-top:2px; }
    footer { margin-top:28px; padding-top:16px; border-top:1px solid ${BRAND.border}; font-size:11px; color:${BRAND.muted}; line-height:1.5; }
    @media print { body { background:#fff; padding:0; } .page { border:none; } }
  </style>
</head>
<body>
  <div class="page">
    ${brandWordmarkHtml({ sizePx: 20 })}
    <p class="kicker" style="margin-top:18px;">${escapeHtml(input.kicker)}</p>
    <h1>${escapeHtml(input.heading)}</h1>
    ${input.body}
    <footer>
      Confidencial. Solo para evaluación de talento con Codiva.dev. No reenviar al candidato ni publicar.
      Las semillas de la cacería y el banco de preguntas no forman parte de este documento.
    </footer>
  </div>
</body>
</html>`;
}
