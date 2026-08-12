import { NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { requestAuditFromHeaders } from '@/lib/ops/request-audit';
import {
  CAREER_RL_ASSESSMENT,
  careerRateLimitConsume,
  safeCareerStr,
} from '@/lib/ops/careers';
import { getAssessmentCatalog } from '@/lib/careers/assessments/catalog';
import {
  isAssessmentEventType,
  remainingMs,
  sanitizeAnswerKeys,
} from '@/lib/careers/assessments/engine';
import {
  expireIfNeeded,
  loadAttemptByToken,
  parseAnswers,
  recordAssessmentEvent,
} from '@/lib/careers/assessments/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 503 });
  }

  const audit = requestAuditFromHeaders(request.headers);
  const ip = audit.ip || 'unknown';
  const rl = careerRateLimitConsume(
    `career_assessment_progress:${ip}`,
    CAREER_RL_ASSESSMENT.windowMs,
    CAREER_RL_ASSESSMENT.max
  );
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json_body' }, { status: 400 });
  }

  const token = safeCareerStr(body.token, 80);
  if (token.length < 16) {
    return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
  }

  const found = await loadAttemptByToken(token);
  if (!found) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  const row = await expireIfNeeded(found);
  if (row.status !== 'started') {
    return NextResponse.json({
      ok: true,
      status: row.status,
      remaining_ms: 0,
      expired: row.status === 'expired',
    });
  }

  const catalog = getAssessmentCatalog(row.catalog_key);
  if (!catalog) {
    return NextResponse.json({ ok: false, error: 'catalog_missing' }, { status: 500 });
  }

  const allowedIds = new Set(row.question_ids);
  const nextAnswers = { ...parseAnswers(row.answers) };
  const questionId = safeCareerStr(body.question_id ?? body.questionId, 80);
  if (questionId && allowedIds.has(questionId) && body.answer !== undefined) {
    const keys = sanitizeAnswerKeys(catalog, questionId, body.answer);
    if (keys) nextAnswers[questionId] = keys;
  }

  const eventTypeRaw = safeCareerStr(body.event_type ?? body.eventType, 40);
  const eventType = isAssessmentEventType(eventTypeRaw) ? eventTypeRaw : null;
  const blurInc = eventType === 'window_blur' ? 1 : 0;

  const admin = createAdminClient();
  await admin
    .from('ops_job_assessment_attempts')
    .update({
      answers: nextAnswers,
      last_activity_at: new Date().toISOString(),
      blur_count: row.blur_count + blurInc,
    })
    .eq('id', row.id)
    .eq('status', 'started');

  if (eventType) {
    await recordAssessmentEvent({
      attemptId: row.id,
      eventType,
      questionId: allowedIds.has(questionId) ? questionId : null,
      payload: body.payload && typeof body.payload === 'object' ? (body.payload as Record<string, unknown>) : {},
      ip: audit.ip,
    });
  }

  return NextResponse.json({
    ok: true,
    status: 'started',
    remaining_ms: remainingMs(row.expires_at),
  });
}
