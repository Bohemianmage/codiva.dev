import Link from 'next/link';
import LegalDocumentView from '@/components/ops/LegalDocumentView';
import { getAcceptanceStatus, type MemberAcceptanceFields } from '@/lib/ops/legal/acceptances';
import { getLegalDocument } from '@/lib/ops/legal/content';
import { LEGAL_DOCS_VERSION, LEGAL_UPDATED_LABEL } from '@/lib/ops/legal/version';
import { labelsFor } from '@/lib/ops/labels';
import { getLocale, getT } from '@/i18n/locale';

const DOCS = [
  { kind: 'terms' as const, href: '/legal/terminos', titleKey: 'portal.legalAccept.terms', dateKey: 'terms_accepted_at', versionKey: 'terms_version' },
  { kind: 'privacy' as const, href: '/legal/aviso-privacidad', titleKey: 'portal.legalAccept.privacy', dateKey: 'privacy_accepted_at', versionKey: 'privacy_version' },
  { kind: 'nda' as const, href: '/legal/nda', titleKey: 'portal.legalAccept.nda', dateKey: 'nda_accepted_at', versionKey: 'nda_version' },
] as const;

export default async function PortalAcceptedLegal({
  email,
  membership,
  isStaffPreview = false,
}: {
  email?: string | null;
  membership: MemberAcceptanceFields | null;
  isStaffPreview?: boolean;
}) {
  const t = await getT();
  const locale = await getLocale();
  const { formatDate } = labelsFor(locale);
  const status = getAcceptanceStatus(membership);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">{t('portal.account.title')}</h1>
        <p className="text-sm text-zinc-600">
          {t('portal.account.intro', { version: LEGAL_DOCS_VERSION, updated: LEGAL_UPDATED_LABEL })}
        </p>
        {email ? (
          <p className="text-sm text-zinc-500">
            {t('portal.account.email')}: <span className="font-medium text-zinc-800">{email}</span>
          </p>
        ) : null}
        {isStaffPreview ? <p className="text-sm text-amber-800">{t('portal.account.staffPreview')}</p> : null}
      </header>

      <ul className="grid gap-3 sm:grid-cols-3">
        {DOCS.map((doc) => {
          const acceptedAt = membership?.[doc.dateKey];
          const version = membership?.[doc.versionKey];
          const ok =
            (doc.kind === 'terms' && status.terms) ||
            (doc.kind === 'privacy' && status.privacy) ||
            (doc.kind === 'nda' && status.nda);
          return (
            <li key={doc.kind} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="font-semibold text-zinc-900">{t(doc.titleKey)}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {ok && acceptedAt
                  ? t('portal.account.acceptedOn', { date: formatDate(acceptedAt) })
                  : t('portal.account.pending')}
              </p>
              <p className="text-xs text-zinc-500">
                {t('portal.account.version', { version: version || LEGAL_DOCS_VERSION })}
              </p>
              <a href={`#${doc.kind}`} className="mt-3 inline-block text-sm font-medium text-codiva-primary hover:underline">
                {t('portal.account.read')}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="space-y-6">
        {DOCS.map((doc) => (
          <section
            key={doc.kind}
            id={doc.kind}
            className="scroll-mt-6 rounded-2xl border border-zinc-200 bg-white px-6 py-8 sm:px-10"
          >
            <div className="mb-6 flex justify-end">
              <Link href={doc.href} target="_blank" className="text-xs font-medium text-codiva-primary hover:underline">
                {t('portal.account.openFull')}
              </Link>
            </div>
            <LegalDocumentView doc={getLegalDocument(doc.kind, locale)} />
          </section>
        ))}
      </div>
    </div>
  );
}
