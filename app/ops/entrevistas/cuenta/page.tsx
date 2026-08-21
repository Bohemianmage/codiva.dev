import Link from 'next/link';
import InterviewsChrome from '@/components/ops/InterviewsChrome';
import PortalAcceptedLegal from '@/components/ops/PortalAcceptedLegal';
import { requireInterviewsAccess } from '@/lib/ops/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getT } from '@/i18n/locale';
import { interviewsHref } from '@/lib/ops/interview-view-as';

export default async function InterviewsAccountPage() {
  const access = await requireInterviewsAccess();
  const t = await getT();
  const homeHref = await interviewsHref('/');
  let email = access.user.email;
  if (access.isStaffPreview && access.member) {
    const { data } = await createAdminClient().auth.admin.getUserById(access.member.user_id);
    email = data.user?.email ?? email;
  }
  return (
    <InterviewsChrome
      isStaffPreview={access.isStaffPreview}
      orgName={access.partner?.name}
      viewAsName={access.isStaffPreview ? access.member?.full_name : null}
    >
      <h1 className="text-xl font-bold text-zinc-900">{t('portal.account.title')}</h1>
      <p className="mt-2 text-sm">
        <Link href={homeHref} className="text-codiva-primary hover:underline">
          {t('interviews.back')}
        </Link>
      </p>
      <div className="mt-6">
        <PortalAcceptedLegal
          email={email}
          membership={access.member}
          isStaffPreview={access.isStaffPreview}
          viewAsName={access.isStaffPreview ? access.member?.full_name : null}
        />
      </div>
    </InterviewsChrome>
  );
}
