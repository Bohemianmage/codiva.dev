import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { requestAuditFromHeaders } from '@/lib/ops/request-audit';
import { careerRateLimitConsume, safeCareerStr } from '@/lib/ops/careers';
import { loadAttemptByToken } from '@/lib/careers/assessments/server';
import { HUNT_MAX_EVIDENCE_BYTES, storeHuntEvidence } from '@/lib/careers/hunt/evidence';

export const runtime = 'nodejs';

const RL = { windowMs: 60 * 60 * 1000, max: 30 };

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 503 });
  }

  const audit = requestAuditFromHeaders(request.headers);
  const ip = audit.ip || 'unknown';
  const rl = await careerRateLimitConsume(`career_hunt_evidence:${ip}`, RL.windowMs, RL.max);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_form' }, { status: 400 });
  }

  const token = safeCareerStr(form.get('token'), 80);
  if (token.length < 16) {
    return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size < 24 || file.size > HUNT_MAX_EVIDENCE_BYTES) {
    return NextResponse.json({ ok: false, error: 'invalid_file' }, { status: 400 });
  }

  const attempt = await loadAttemptByToken(token);
  if (!attempt || attempt.status !== 'completed' || !attempt.passed) {
    return NextResponse.json({ ok: false, error: 'assessment_not_passed' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeHuntEvidence({
    folder: attempt.id,
    buffer,
    filename: file.name || 'paste.png',
  });
  if ('error' in stored) {
    return NextResponse.json({ ok: false, error: stored.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, path: stored.path });
}
