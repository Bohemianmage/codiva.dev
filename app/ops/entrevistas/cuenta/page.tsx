import Link from 'next/link';
import InterviewsChrome from '@/components/ops/InterviewsChrome';
import PortalAcceptedLegal from '@/components/ops/PortalAcceptedLegal';
import { requireInterviewsAccess } from '@/lib/ops/auth';
import { getT } from '@/i18n/locale';

export default async function InterviewsAccountPage() {
  const access = await requireInterviewsAccess();
  const t = await getT();
  return (
    <InterviewsChrome isStaffPreview={access.isStaffPreview} orgName={access.partner?.name}>
      <h1 className="text-xl font-bold text-zinc-900">{t('portal.account.title')}</h1>
      <p className="mt-2 text-sm">
        <Link href="/" className="text-codiva-primary hover:underline">
          {t('interviews.back')}
        </Link>
      </p>
      <div className="mt-6">
        <PortalAcceptedLegal email={access.user.email} membership={access.member} />
      </div>
    </InterviewsChrome>
  );
}
