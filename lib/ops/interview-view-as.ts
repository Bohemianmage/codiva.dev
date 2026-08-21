import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { interviewsAppHref } from '@/lib/ops/host';
import { isInterviewUuid, parseInterviewViewAsCookie } from '@/lib/ops/interview-partner';
import type { InterviewPartnerMember, InterviewPartnerOrg } from '@/lib/ops/auth';

export const INTERVIEW_VIEW_AS_COOKIE = 'codiva_interviews_as';
export const INTERVIEW_VIEW_AS_MAX_AGE = 60 * 60 * 8;

const MEMBER_SELECT =
  'id, partner_id, user_id, full_name, role, active, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, nda_accepted_at, nda_version';

export async function interviewsHref(path = '/'): Promise<string> {
  const host = (await headers()).get('x-codiva-host') || (await headers()).get('host');
  return interviewsAppHref(host, path);
}

export async function readInterviewViewAsMemberId(): Promise<string | null> {
  const jar = await cookies();
  return parseInterviewViewAsCookie(jar.get(INTERVIEW_VIEW_AS_COOKIE)?.value);
}

export async function loadInterviewMemberById(memberId: string) {
  if (!isInterviewUuid(memberId)) return null;
  const admin = createAdminClient();
  const { data: member } = await admin
    .from('ops_recruiting_partner_members')
    .select(`${MEMBER_SELECT}, ops_recruiting_partners!inner(id, name, active)`)
    .eq('id', memberId)
    .eq('active', true)
    .eq('ops_recruiting_partners.active', true)
    .maybeSingle();

  if (!member) return null;
  const raw = member.ops_recruiting_partners as InterviewPartnerOrg | InterviewPartnerOrg[] | null;
  const partner = Array.isArray(raw) ? raw[0] : raw;
  if (!partner?.active) return null;
  const { ops_recruiting_partners: _ignored, ...rest } = member as typeof member & {
    ops_recruiting_partners: unknown;
  };
  return { member: rest as InterviewPartnerMember, partner };
}
