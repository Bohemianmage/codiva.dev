import LegalDocumentView from '@/components/ops/LegalDocumentView';
import { TERMS_OF_USE } from '@/lib/ops/legal/content';
import Link from 'next/link';

export const metadata = {
  title: 'Términos y Condiciones - Codiva',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto mb-6 max-w-3xl">
        <Link href="/" className="text-sm text-codiva-primary hover:underline">
          ← Volver
        </Link>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-8 sm:px-10">
        <LegalDocumentView doc={TERMS_OF_USE} />
      </div>
    </div>
  );
}
