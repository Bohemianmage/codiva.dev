import { createAdminClient } from '@/lib/supabase/admin';

export function normalizeCareerEmail(value: string | null | undefined): string | null {
  const email = String(value || '').trim().toLowerCase();
  if (!email.includes('@') || email.length > 320) return null;
  return email;
}

export function offerCareerEmails(offer: {
  email?: string | null;
  career_email?: string | null;
}): string[] {
  return [...new Set([offer.career_email, offer.email].map(normalizeCareerEmail).filter(Boolean))] as string[];
}

export type OfferCareerAttempt = {
  id: string;
  catalog_key: string;
  status: string;
  passed: boolean | null;
  score_pct: number | null;
  completed_at: string | null;
  started_at: string;
};

export type OfferCareerApplication = {
  id: string;
  status: string;
  original_filename: string | null;
  cover_letter: string | null;
  created_at: string;
  posting_title: string | null;
};

export type OfferCareerFinding = {
  id: string;
  title: string;
  page_url: string;
  description: string | null;
  expected: string | null;
  matched_seed_id: string | null;
  review_status: string | null;
  evidence_paths: string[] | null;
  created_at: string;
  assessment_attempt_id: string | null;
};

export type OfferCareerFile = {
  emails: string[];
  attempts: OfferCareerAttempt[];
  applications: OfferCareerApplication[];
  findings: OfferCareerFinding[];
};

function emailOrFilter(column: string, emails: string[]): string {
  return emails.map((email) => `${column}.ilike."${email}"`).join(',');
}

export async function loadOfferCareerFile(emails: string[]): Promise<OfferCareerFile> {
  const unique = [...new Set(emails.map(normalizeCareerEmail).filter(Boolean))] as string[];
  if (!unique.length) {
    return { emails: [], attempts: [], applications: [], findings: [] };
  }

  const admin = createAdminClient();
  const attemptFilter = emailOrFilter('email', unique);
  const [{ data: attempts }, { data: applications }, { data: findings }] = await Promise.all([
    admin
      .from('ops_job_assessment_attempts')
      .select('id, catalog_key, status, passed, score_pct, completed_at, started_at')
      .or(attemptFilter)
      .order('started_at', { ascending: false })
      .limit(40),
    admin
      .from('ops_job_applications')
      .select('id, status, original_filename, cover_letter, created_at, ops_job_postings(title)')
      .or(attemptFilter)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('ops_hunt_reports')
      .select(
        'id, title, page_url, description, expected, matched_seed_id, review_status, evidence_paths, created_at, assessment_attempt_id'
      )
      .or(attemptFilter)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  return {
    emails: unique,
    attempts: (attempts ?? []) as OfferCareerAttempt[],
    applications: (applications ?? []).map((row) => {
      const posting = Array.isArray(row.ops_job_postings) ? row.ops_job_postings[0] : row.ops_job_postings;
      return {
        id: row.id,
        status: row.status,
        original_filename: row.original_filename,
        cover_letter: row.cover_letter,
        created_at: row.created_at,
        posting_title: posting?.title ?? null,
      };
    }),
    findings: (findings ?? []) as OfferCareerFinding[],
  };
}

export async function findPersonnelOfferIdForEmail(email: string | null | undefined): Promise<string | null> {
  const normalized = normalizeCareerEmail(email);
  if (!normalized) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('ops_personnel_offers')
    .select('id')
    .or(`career_email.ilike."${normalized}",email.ilike."${normalized}"`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}
