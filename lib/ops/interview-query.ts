import { createAdminClient } from '@/lib/supabase/admin';
import { interviewFollowUp, visibleApplicationIds } from '@/lib/ops/interview-partner';
import type { InterviewPartnerMember } from '@/lib/ops/auth';

export type InterviewQueueRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  jobTitle: string | null;
  followUp: ReturnType<typeof interviewFollowUp>;
};

export async function listInterviewQueue(opts: {
  isStaffPreview: boolean;
  member: InterviewPartnerMember | null;
}): Promise<InterviewQueueRow[]> {
  const admin = createAdminClient();

  if (opts.isStaffPreview) {
    const { data: applications } = await admin
      .from('ops_job_applications')
      .select('id, full_name, email, phone, status, ops_job_postings(title)')
      .eq('status', 'interview')
      .order('created_at', { ascending: false })
      .limit(80);
    return toQueueRows(applications ?? [], new Map());
  }

  if (!opts.member) return [];

  const [{ data: assignments }, { data: rounds }] = await Promise.all([
    admin
      .from('ops_interview_assignments')
      .select('round_id, application_id, job_posting_id')
      .eq('member_id', opts.member.id),
    admin.from('ops_job_interview_rounds').select('id, application_id, status'),
  ]);

  const { data: applications } = await admin
    .from('ops_job_applications')
    .select('id, full_name, email, phone, status, job_posting_id, ops_job_postings(title)')
    .order('created_at', { ascending: false });

  const visible = new Set(
    visibleApplicationIds(assignments ?? [], applications ?? [], rounds ?? [])
  );
  const scoped = (applications ?? []).filter((row) => visible.has(row.id));
  const roundIds = (rounds ?? []).filter((row) => visible.has(row.application_id)).map((row) => row.id);
  const { data: reports } = roundIds.length
    ? await admin.from('ops_interview_reports').select('round_id').in('round_id', roundIds)
    : { data: [] as { round_id: string }[] };
  const reportCount = new Map<string, number>();
  for (const report of reports ?? []) {
    reportCount.set(report.round_id, (reportCount.get(report.round_id) ?? 0) + 1);
  }
  const followUpByApp = new Map<string, ReturnType<typeof interviewFollowUp>>();
  for (const round of rounds ?? []) {
    if (!visible.has(round.application_id)) continue;
    const next = interviewFollowUp({
      status: round.status,
      reportCount: reportCount.get(round.id) ?? 0,
    });
    const prev = followUpByApp.get(round.application_id);
    if (!prev || rankFollowUp(next) < rankFollowUp(prev)) {
      followUpByApp.set(round.application_id, next);
    }
  }
  return toQueueRows(scoped, followUpByApp);
}

function rankFollowUp(value: ReturnType<typeof interviewFollowUp>) {
  if (value === 'pending') return 0;
  if (value === 'needs_report') return 1;
  return 2;
}

function toQueueRows(
  applications: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    status: string;
    ops_job_postings?: { title?: string | null } | { title?: string | null }[] | null;
  }[],
  followUpByApp: Map<string, ReturnType<typeof interviewFollowUp>>
): InterviewQueueRow[] {
  return applications.map((row) => {
    const posting = Array.isArray(row.ops_job_postings) ? row.ops_job_postings[0] : row.ops_job_postings;
    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      jobTitle: posting?.title ?? null,
      followUp: followUpByApp.get(row.id) ?? 'pending',
    };
  });
}
