import { NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { requestAuditFromHeaders } from '@/lib/ops/request-audit';
import {
  CAREER_CV_BUCKET,
  CAREER_MAX_CV_BYTES,
  CAREER_RL_SIGN_UPLOAD,
  CAREER_SIGNED_UPLOAD_EXPIRES_SEC,
  buildCvStoragePath,
  careerRateLimitConsume,
  safeCareerStr,
} from '@/lib/ops/careers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 503 });
  }

  const audit = requestAuditFromHeaders(request.headers);
  const ip = audit.ip || 'unknown';
  const rl = await careerRateLimitConsume(
    `career_sign_upload:${ip}`,
    CAREER_RL_SIGN_UPLOAD.windowMs,
    CAREER_RL_SIGN_UPLOAD.max
  );
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

  const mime = String(body.mime_type ?? body.mime ?? '')
    .trim()
    .toLowerCase();
  if (mime !== 'application/pdf') {
    return NextResponse.json({ ok: false, error: 'mime_type_not_allowed' }, { status: 400 });
  }

  const byteSize = Number(body.byte_size ?? body.size);
  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > CAREER_MAX_CV_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'invalid_byte_size', max_bytes: CAREER_MAX_CV_BYTES },
      { status: 400 }
    );
  }

  const originalName = safeCareerStr(body.original_filename ?? body.filename, 200);
  if (!originalName) {
    return NextResponse.json({ ok: false, error: 'missing_original_filename' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from('ops_job_postings')
    .select('id, status')
    .eq('id', jobPostingId)
    .maybeSingle();

  if (jobErr) {
    return NextResponse.json({ ok: false, error: 'job_lookup_failed' }, { status: 500 });
  }
  if (!job?.id || job.status !== 'published') {
    return NextResponse.json({ ok: false, error: 'job_not_available' }, { status: 400 });
  }

  const storagePath = buildCvStoragePath(jobPostingId, originalName);
  const { data: signed, error: signErr } = await admin.storage
    .from(CAREER_CV_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ ok: false, error: 'signed_upload_url_failed' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    signed_upload_url: signed.signedUrl,
    path: signed.path || storagePath,
    token: signed.token || null,
    bucket: CAREER_CV_BUCKET,
    expires_in: CAREER_SIGNED_UPLOAD_EXPIRES_SEC,
  });
}
