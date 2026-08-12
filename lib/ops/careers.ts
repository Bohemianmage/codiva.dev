import { createHash, randomBytes, randomUUID } from 'crypto';
import { careerBaseUrl } from '@/lib/ops/host';
import { createAdminClient } from '@/lib/supabase/admin';
import { tSync } from '@/i18n/translate';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

export const CAREER_CV_BUCKET = 'job-application-cvs';
export const CAREER_MAX_CV_BYTES = 10 * 1024 * 1024;
export const CAREER_DEDUPE_HOURS = Number(process.env.CAREER_APPLY_DEDUPE_HOURS || 24);
export const CAREER_SIGNED_UPLOAD_EXPIRES_SEC = 120;

export const JOB_POSTING_STATUSES = ['draft', 'published', 'closed'] as const;
export type JobPostingStatus = (typeof JOB_POSTING_STATUSES)[number];

export const JOB_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'] as const;
export type JobEmploymentType = (typeof JOB_EMPLOYMENT_TYPES)[number];

export const JOB_APPLICATION_STATUSES = ['new', 'reviewed', 'hired', 'rejected'] as const;
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

export const JOB_POSTING_STATUS_LABELS: Record<JobPostingStatus, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  closed: 'Cerrada',
};

export const JOB_EMPLOYMENT_LABELS: Record<JobEmploymentType, string> = {
  full_time: 'Tiempo completo',
  part_time: 'Medio tiempo',
  contract: 'Por proyecto',
  internship: 'Prácticas',
};

export function jobEmploymentLabel(
  type: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE
): string | null {
  if (!type || !isJobEmploymentType(type)) return null;
  return tSync(locale, `career.employment.${type}`);
}

export const JOB_APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  new: 'Nueva',
  reviewed: 'Revisada',
  hired: 'Contratada',
  rejected: 'Descartada',
};

export function isJobPostingStatus(value: string): value is JobPostingStatus {
  return (JOB_POSTING_STATUSES as readonly string[]).includes(value);
}

export function isJobEmploymentType(value: string): value is JobEmploymentType {
  return (JOB_EMPLOYMENT_TYPES as readonly string[]).includes(value);
}

export function isJobApplicationStatus(value: string): value is JobApplicationStatus {
  return (JOB_APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function publicCareerListUrl(): string {
  return careerBaseUrl();
}

export function publicCareerUrl(slug: string): string {
  return `${careerBaseUrl()}/${slug}`;
}

export function normalizeJobSlug(input: string): string {
  const slug = String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return slug.length >= 2 ? slug : 'vacante';
}

export function uniqueJobSlugCandidate(base: string): string {
  const root = normalizeJobSlug(base);
  const suffix = randomBytes(3).toString('hex');
  return `${root}-${suffix}`.slice(0, 120);
}

export function sanitizePdfFilename(name: string): string {
  const base = String(name || 'cv.pdf').trim().toLowerCase();
  const cleaned = base.replace(/[^a-z0-9._-]+/g, '_').slice(0, 120);
  return cleaned.endsWith('.pdf') ? cleaned : `${cleaned || 'cv'}.pdf`;
}

export function buildCvStoragePath(jobPostingId: string, originalFilename: string): string {
  const safe = sanitizePdfFilename(originalFilename);
  return `applications/${jobPostingId}/${randomUUID()}_${safe}`;
}

export function isCvPathForJob(jobPostingId: string, path: string): boolean {
  const p = String(path || '').trim();
  const jid = String(jobPostingId || '').trim().toLowerCase();
  if (!jid || !/^[0-9a-f-]{36}$/i.test(jid)) return false;
  const re = new RegExp(
    `^applications/${jid}/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}_.+\\.pdf$`,
    'i'
  );
  return re.test(p);
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('utf8') === '%PDF-';
}

export function hashCareerIp(ip: string | null | undefined): string | null {
  const pepper =
    String(process.env.CAREER_IP_PEPPER || '').trim() ||
    String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!pepper || !ip) return null;
  return createHash('sha256').update(`${pepper}:${ip}`).digest('hex');
}

export function safeCareerStr(value: unknown, max: number): string {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

function pruneRateBuckets() {
  if (rateBuckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (v.resetAt < now) rateBuckets.delete(k);
  }
}

export function careerRateLimitConsume(
  key: string,
  windowMs: number,
  max: number
): { ok: true; remaining: number } | { ok: false; retryAfterMs: number } {
  pruneRateBuckets();
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count <= max) return { ok: true, remaining: max - bucket.count };
  return { ok: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
}

export const CAREER_RL_SIGN_UPLOAD = {
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.CAREER_RL_SIGN_UPLOAD_PER_IP_HOUR || 40),
};

export const CAREER_RL_APPLY = {
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.CAREER_RL_APPLY_PER_IP_HOUR || 15),
};

export const CAREER_RL_APPLY_EMAIL = {
  windowMs: 24 * 60 * 60 * 1000,
  max: Number(process.env.CAREER_RL_APPLY_PER_EMAIL_DAY || 8),
};

export const CAREER_RL_ASSESSMENT = {
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.CAREER_RL_ASSESSMENT_PER_IP_HOUR || 40),
};

const BULLET_LINE_RE = /^[\u2022\u2023\u25E6\u2043\u2219•\-*]\s+(.*)$/;
export {
  CAREER_DISCIPLINES,
  CAREER_DISCIPLINE_LABELS,
  CAREER_DISCIPLINE_CATALOG,
  isCareerDiscipline,
  postingAsksDiscipline,
  type CareerDiscipline,
} from '@/lib/ops/career-disciplines';

const SECTION_TITLES = new Set(
  [
    'descripción',
    'description',
    'responsabilidades',
    'responsibilities',
    'sobre el rol',
    'about the role',
    'perfiles que buscamos',
    'condiciones',
    'conditions',
    'perfil',
    'profile',
    'requisitos',
    'requirements',
  ].map((s) => s.toLowerCase())
);

export type CareerBodyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export type CareerPostingSection = {
  title: string;
  blocks: CareerBodyBlock[];
};

function formatSectionBody(body: string): CareerBodyBlock[] {
  const lines = String(body ?? '').split('\n');
  const blocks: CareerBodyBlock[] = [];
  let paragraphBuf: string[] = [];
  let listBuf: string[] = [];

  const flushParagraph = () => {
    const text = paragraphBuf.join('\n').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraphBuf = [];
  };
  const flushList = () => {
    if (listBuf.length) blocks.push({ type: 'list', items: [...listBuf] });
    listBuf = [];
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      flushList();
      flushParagraph();
      continue;
    }
    const bullet = trimmed.match(BULLET_LINE_RE);
    if (bullet) {
      flushParagraph();
      listBuf.push(bullet[1].trim());
      continue;
    }
    flushList();
    paragraphBuf.push(trimmed);
  }
  flushList();
  flushParagraph();
  return blocks;
}

export function parseCareerPostingSections(text: string | null | undefined): CareerPostingSection[] {
  const raw = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!raw) return [];

  const lines = raw.split('\n');
  const sections: { title: string; lines: string[] }[] = [];
  let current = { title: '', lines: [] as string[] };

  const pushCurrent = () => {
    const body = current.lines.join('\n').trim();
    if (current.title || body) sections.push({ title: current.title.trim(), lines: [...current.lines] });
    current = { title: '', lines: [] };
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const header = trimmed.match(/^(.+):\s*$/);
    if (header && SECTION_TITLES.has(header[1].trim().toLowerCase())) {
      pushCurrent();
      current.title = header[1].trim();
      continue;
    }
    current.lines.push(line);
  }
  pushCurrent();

  return sections
    .map((section) => ({
      title: section.title,
      blocks: formatSectionBody(section.lines.join('\n')),
    }))
    .filter((section) => section.title || section.blocks.length);
}

export async function assertCareerCvObjectExists(storagePath: string): Promise<boolean> {
  const admin = createAdminClient();
  const parts = String(storagePath || '')
    .split('/')
    .filter(Boolean);
  if (parts.length < 2) return false;
  const fileName = parts.pop();
  const dir = parts.join('/');
  const { data, error } = await admin.storage.from(CAREER_CV_BUCKET).list(dir, { limit: 100 });
  if (error || !Array.isArray(data) || !fileName) return false;
  return data.some((f) => f.name === fileName);
}
