import PortalAcceptedLegal from '@/components/ops/PortalAcceptedLegal';
import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { getT } from '@/i18n/locale';

export async function generateMetadata() {
  const t = await getT();
  return { title: t('portal.account.title') };
}

export default async function PortalAccountPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await requirePortalMemberWithAcceptances(slug);

  return (
    <PortalAcceptedLegal
      email={access.user.email}
      membership={access.membership}
      isStaffPreview={access.isStaffPreview}
    />
  );
}
