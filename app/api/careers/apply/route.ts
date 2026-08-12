import { NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { requestAuditFromHeaders } from '@/lib/ops/request-audit';
import { logActivity } from '@/lib/ops/activity';
import { notifyStaff } from '@/lib/ops/email';
import { templateCareerApplicationStaff } from '@/lib/ops/email-templates';
import {
  CAREER_DEDUPE_HOURS,
  CAREER_RL_APPLY,
  CAREER_RL_APPLY_EMAIL,
  assertCareerCvObjectExists,
  careerRateLimitConsume,
  hashCareerIp,
  isCvPathForJob,
  safeCareerStr,
} from '@/lib/ops/careers';
import { opsBaseUrl } from '@/lib/ops/host';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 503 });
  }

  const audit = requestAuditFromHeaders(request.headers);
  const ip = audit.ip || 'unknown';
  const rl = careerRateLimitConsume(`career_apply:${ip}`, CAREER_RL_APPLY.windowMs, CAREER_RL_APPLY.max);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json_body' }, { status: 400 });
  }

  const jobPostingId = safeCareerStr(body.job_posting_id ?? body.jobPostingId, 40);
  if (!jobPostingId || !/^[0-9a-f-]{36}$/i.test(jobPostingId)) {
    return NextResponse.json({ ok: false, error: 'missing_or_invalid_job_posting_id' }, { status: 400 });
  }

  const cvPath = safeCareerStr(body.cv_storage_path ?? body.cvStoragePath, 512);
  if (!cvPath || !isCvPathForJob(jobPostingId, cvPath)) {
    return NextResponse.json({ ok: false, error: 'invalid_cv_storage_path' }, { status: 400 });
  }

  const consentData = Boolean(body.consent_data ?? body.consentData);
  const consentTerms = Boolean(body.consent_terms ?? body.consentTerms);
  if (!consentData || !consentTerms) {
    return NextResponse.json({ ok: false, error: 'consent_required' }, { status: 400 });
  }

  const fullName = safeCareerStr(body.full_name ?? body.fullName, 200);
  const email = safeCareerStr(body.email, 320).toLowerCase();
  const phone = safeCareerStr(body.phone, 40);
  const coverLetter = safeCareerStr(body.cover_letter ?? body.coverLetter, 8000);
  const originalFilename = safeCareerStr(body.original_filename ?? body.originalFilename, 200);

  if (!fullName || !email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'missing_or_invalid_contact' }, { status: 400 });
  }

  const emailRl = careerRateLimitConsume(
    `career_apply_email:${email}`,
    CAREER_RL_APPLY_EMAIL.windowMs,
    CAREER_RL_APPLY_EMAIL.max
  );
  if (!emailRl.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited_email' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(emailRl.retryAfterMs / 1000)) } }
    );
  }

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from('ops_job_postings')
    .select('id, title, slug, status')
    .eq('id', jobPostingId)
    .maybeSingle();

  if (jobErr) {
    return NextResponse.json({ ok: false, error: 'job_lookup_failed' }, { status: 500 });
  }
  if (!job?.id || job.status !== 'published') {
    return NextResponse.json({ ok: false, error: 'job_not_available' }, { status: 400 });
  }

  const cutoff = new Date(Date.now() - CAREER_DEDUPE_HOURS * 3600 * 1000).toISOString();
  const { data: dup, error: dupErr } = await admin
    .from('ops_job_applications')
    .select('id')
    .eq('job_posting_id', jobPostingId)
    .ilike('email', email)
    .gte('created_at', cutoff)
    .maybeSingle();

  if (dupErr) {
    return NextResponse.json({ ok: false, error: 'dedupe_lookup_failed' }, { status: 500 });
  }
  if (dup?.id) {
    return NextResponse.json({ ok: false, error: 'duplicate_application' }, { status: 409 });
  }

  const exists = await assertCareerCvObjectExists(cvPath);
  if (!exists) {
    return NextResponse.json({ ok: false, error: 'cv_upload_not_found' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: inserted, error: insertErr } = await admin
    .from('ops_job_applications')
    .insert({
      job_posting_id: jobPostingId,
      full_name: fullName,
      email,
      phone: phone || null,
      cover_letter: coverLetter || null,
      cv_storage_path: cvPath,
      original_filename: originalFilename || null,
      consent_data_at: now,
      consent_terms_at: now,
      ip_hash: hashCareerIp(ip),
      status: 'new',
    })
    .select('id')
    .maybeSingle();

  if (insertErr) {
    console.error('POST /api/careers/apply insert:', insertErr);
    return NextResponse.json({ ok: false, error: 'application_insert_failed' }, { status: 500 });
  }

  await logActivity({
    entityType: 'job_application',
    entityId: inserted?.id || jobPostingId,
    action: 'created',
    metadata: { jobPostingId, slug: job.slug },
  });

  await notifyStaff({
    subject: `[Bolsa] ${fullName} · ${job.title}`,
    html: templateCareerApplicationStaff({
      name: fullName,
      email,
      phone,
      jobTitle: job.title,
      coverLetter,
      opsHref: `${opsBaseUrl()}/team?tab=bolsa`,
    }),
    replyTo: email,
  }).catch(() => {});

  return NextResponse.json({ ok: true, application_id: inserted?.id || null });
}
