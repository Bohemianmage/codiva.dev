import { headers } from 'next/headers';

export type RequestAudit = {
  ip: string | null;
  userAgent: string | null;
};

export async function getRequestAudit(): Promise<RequestAudit> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    null;
  return {
    ip,
    userAgent: h.get('user-agent'),
  };
}

export function requestAuditFromHeaders(h: Headers): RequestAudit {
  const forwarded = h.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    null;
  return {
    ip,
    userAgent: h.get('user-agent'),
  };
}
