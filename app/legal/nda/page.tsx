import LegalDocumentView from '@/components/ops/LegalDocumentView';
import { getLegalDocument } from '@/lib/ops/legal/content';
import { getLocale, getT } from '@/i18n/locale';

export async function generateMetadata() {
  const t = await getT();
  return { title: t('legal.ndaTitle') };
}

export default async function NdaPage() {
  const locale = await getLocale();
  return (
    <div className="px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-8 sm:px-10">
        <LegalDocumentView doc={getLegalDocument('nda', locale)} />
      </div>
    </div>
  );
}
