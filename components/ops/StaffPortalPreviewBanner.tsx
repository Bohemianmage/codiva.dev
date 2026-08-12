import Link from 'next/link';
import { getT } from '@/i18n/locale';

export default async function StaffPortalPreviewBanner({
  projectName,
  projectId,
}: {
  projectName: string;
  projectId: string;
}) {
  const t = await getT();
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
        <p>
          <span className="font-semibold">{t('ops.preview.staff')}</span>
          {' · '}
          {t('ops.preview.body')} <span className="font-medium">{projectName}</span>. {t('ops.preview.noLegal')}
        </p>
        <Link href={`/projects/${projectId}`} className="font-medium underline underline-offset-2 hover:no-underline">
          {t('ops.preview.back')}
        </Link>
      </div>
    </div>
  );
}
