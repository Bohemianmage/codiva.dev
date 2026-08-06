import { LEGAL_DOCS_VERSION } from '@/lib/ops/legal/version';

export type MemberAcceptanceFields = {
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  privacy_accepted_at?: string | null;
  privacy_version?: string | null;
  nda_accepted_at?: string | null;
  nda_version?: string | null;
};

export type AcceptanceStatus = {
  terms: boolean;
  privacy: boolean;
  nda: boolean;
  complete: boolean;
  requiredVersion: string;
};

export function getAcceptanceStatus(member: MemberAcceptanceFields | null | undefined): AcceptanceStatus {
  const requiredVersion = LEGAL_DOCS_VERSION;
  const terms = Boolean(member?.terms_accepted_at && member.terms_version === requiredVersion);
  const privacy = Boolean(member?.privacy_accepted_at && member.privacy_version === requiredVersion);
  const nda = Boolean(member?.nda_accepted_at && member.nda_version === requiredVersion);
  return {
    terms,
    privacy,
    nda,
    complete: terms && privacy && nda,
    requiredVersion,
  };
}
