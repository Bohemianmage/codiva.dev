export const INBOX_LANES = ['real', 'test', 'other'] as const;
export type InboxLane = (typeof INBOX_LANES)[number];

export const INBOX_LANE_REASONS = [
  'hunt_session',
  'internal',
  'junk_content',
  'junk_identity',
  'candidate',
  'default',
  'manual',
] as const;
export type InboxLaneReason = (typeof INBOX_LANE_REASONS)[number];

export type InboxLaneResult = {
  lane: InboxLane;
  reason: InboxLaneReason;
};

const INTERNAL_EMAIL_RE = /@(codiva\.dev|codiva\.io)$/i;
const TEST_LOCAL_RE = /(^|\+)(test|prueba|qa)([._+-]|$)/i;
const CONSONANT_CLUSTER_RE = /[bcdfghjklmnpqrstvwxyzñ]{4,}/i;
const ONLY_NOISE_RE = /^[\d\s.,;:!¡?¿_\-/\\'"·•…]+$/u;

export function isInboxLane(value: string | null | undefined): value is InboxLane {
  return Boolean(value && (INBOX_LANES as readonly string[]).includes(value));
}

export function parseInboxLane(value: string | string[] | undefined): InboxLane | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return isInboxLane(raw) ? raw : null;
}

function letterRatio(value: string): number {
  const letters = (value.match(/\p{L}/gu) || []).length;
  return value.length ? letters / value.length : 0;
}

function vowelRatio(value: string): number {
  const vowels = (value.match(/[aeiouáéíóúü]/gi) || []).length;
  return value.length ? vowels / value.length : 0;
}

export function looksLikeJunkMessage(message: string): boolean {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text) return true;
  if (letterRatio(text) < 0.35) return true;
  if (ONLY_NOISE_RE.test(text)) return true;
  if (/^(.)\1{7,}$/u.test(text.replace(/\s/g, ''))) return true;
  const tokens = text.split(' ').filter(Boolean);
  if (tokens.length === 1 && text.length <= 18 && CONSONANT_CLUSTER_RE.test(text)) return true;
  return false;
}

export function looksLikeJunkIdentity(name: string, email: string): boolean {
  const person = name.replace(/\s+/g, ' ').trim();
  const address = email.trim().toLowerCase();
  if (!person || person.length < 2) return true;
  if (INTERNAL_EMAIL_RE.test(address)) return false;
  const local = address.split('@')[0] || '';
  if (TEST_LOCAL_RE.test(local)) return true;
  if (!person.includes(' ') && person.length <= 16 && vowelRatio(person) < 0.28) return true;
  if (!person.includes(' ') && person.length <= 14 && CONSONANT_CLUSTER_RE.test(person)) return true;
  if (local.length >= 8 && vowelRatio(local) < 0.18 && !local.includes('.')) return true;
  return false;
}

export function isInternalTestEmail(email: string): boolean {
  const address = email.trim().toLowerCase();
  if (INTERNAL_EMAIL_RE.test(address)) return true;
  const local = address.split('@')[0] || '';
  return TEST_LOCAL_RE.test(local);
}

export function classifyInboxLane(input: {
  name: string;
  email: string;
  message: string;
  hasHuntSession?: boolean;
  matchedCandidate?: boolean;
}): InboxLaneResult {
  if (input.hasHuntSession) return { lane: 'test', reason: 'hunt_session' };
  if (isInternalTestEmail(input.email)) return { lane: 'test', reason: 'internal' };
  if (looksLikeJunkMessage(input.message)) return { lane: 'test', reason: 'junk_content' };
  if (looksLikeJunkIdentity(input.name, input.email)) return { lane: 'test', reason: 'junk_identity' };
  if (input.matchedCandidate) return { lane: 'other', reason: 'candidate' };
  return { lane: 'real', reason: 'default' };
}

type AdminClient = {
  from: (relation: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { id: string } | null }>;
      };
      ilike: (column: string, value: string) => {
        gte: (column: string, value: string) => {
          limit: (count: number) => Promise<{ data: { id: string }[] | null }>;
        };
      };
    };
  };
};

export async function lookupInboxLaneSignals(
  admin: AdminClient,
  input: { email: string; huntToken?: string }
): Promise<{ hasHuntSession: boolean; matchedCandidate: boolean }> {
  const email = input.email.trim().toLowerCase();
  const token = (input.huntToken || '').trim();
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [attempt, applications, hunts] = await Promise.all([
    token.length >= 16
      ? admin.from('ops_job_assessment_attempts').select('id').eq('public_token', token).maybeSingle()
      : Promise.resolve({ data: null as { id: string } | null }),
    email
      ? admin.from('ops_job_applications').select('id').ilike('email', email).gte('created_at', cutoff).limit(1)
      : Promise.resolve({ data: [] as { id: string }[] }),
    email
      ? admin.from('ops_hunt_reports').select('id').ilike('email', email).gte('created_at', cutoff).limit(1)
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  return {
    hasHuntSession: Boolean(attempt.data?.id),
    matchedCandidate: Boolean(applications.data?.[0]?.id || hunts.data?.[0]?.id),
  };
}
