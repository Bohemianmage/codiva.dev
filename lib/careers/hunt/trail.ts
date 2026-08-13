import { isCareerHost } from '@/lib/ops/host';
import { matchedSeedCountsForDiscipline } from './match';
import type { CareerDiscipline } from '@/lib/ops/career-disciplines';

export type HuntTrailEvent = {
  id?: string;
  event_type: string;
  path: string;
  host: string | null;
  referrer: string | null;
  created_at: string;
};

export type HuntTrailReport = {
  title?: string;
  matched_seed_id: string | null;
  page_url: string;
  created_at: string;
};

export type HuntPageKind =
  | 'feed'
  | 'findings'
  | 'test'
  | 'job'
  | 'jobs'
  | 'home'
  | 'services'
  | 'about'
  | 'cases'
  | 'contact'
  | 'legal'
  | 'other';

export type HuntTrailSurface = 'career' | 'marketing';

export type HuntTrailStep = {
  id: string;
  kind: 'page_view' | 'reported';
  at: string;
  elapsedMs: number;
  dwellMs: number | null;
  visits: number;
  path: string;
  host: string | null;
  referrer: string | null;
  pageKind: HuntPageKind;
  slug?: string;
  surface: HuntTrailSurface;
  isForm: boolean;
  isFeed: boolean;
  findingTitle: string | null;
};

export type HuntTrailRouteStop = {
  key: string;
  pageKind: HuntPageKind;
  slug?: string;
  path: string;
  surface: HuntTrailSurface;
  reported: boolean;
};

export type HuntTrailQuality = {
  pageViews: number;
  uniquePages: number;
  browsedSite: boolean;
  visitedMarketing: boolean;
  visitedCareer: boolean;
  visitedFeed: boolean;
  formOnly: boolean;
  msToFirstCraft: number | null;
  firstCraftAt: string | null;
};

const FORM_PATH_RE = /\/(hallazgos|prueba)(\/|$)/i;
const FEED_RE = /\/api\/careers\/feed/i;

function pageKey(host: string | null, path: string): string {
  return `${(host || '').toLowerCase()}${path}`;
}

export function isHuntFormPath(path: string): boolean {
  return FORM_PATH_RE.test(path);
}

export function urlLooksLikeFeed(value: string): boolean {
  return FEED_RE.test(value);
}

export function summarizeHuntTrail(input: {
  passedAt: string | null;
  discipline: CareerDiscipline | null;
  events: HuntTrailEvent[];
  reports: HuntTrailReport[];
}): HuntTrailQuality {
  const views = input.events.filter((row) => row.event_type === 'page_view');
  const unique = new Set(views.map((row) => pageKey(row.host, row.path)));
  const browsedSite = [...unique].some((key) => {
    const path = key.replace(/^[^/]*/, '') || '/';
    return !isHuntFormPath(path);
  });
  const visitedCareer = views.some((row) => isCareerHost(row.host));
  const visitedMarketing = views.some((row) => row.host && !isCareerHost(row.host));
  const visitedFeed =
    views.some((row) => urlLooksLikeFeed(row.path) || urlLooksLikeFeed(row.referrer || '')) ||
    input.reports.some((row) => urlLooksLikeFeed(row.page_url));

  let firstCraftAt: string | null = null;
  if (input.discipline) {
    for (const row of [...input.reports].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )) {
      if (matchedSeedCountsForDiscipline(row.matched_seed_id, input.discipline)) {
        firstCraftAt = row.created_at;
        break;
      }
    }
  }

  const passedMs = input.passedAt ? new Date(input.passedAt).getTime() : NaN;
  const firstMs = firstCraftAt ? new Date(firstCraftAt).getTime() : NaN;
  const msToFirstCraft =
    Number.isFinite(passedMs) && Number.isFinite(firstMs) && firstMs >= passedMs
      ? firstMs - passedMs
      : firstCraftAt && Number.isFinite(firstMs)
        ? 0
        : null;

  return {
    pageViews: views.length,
    uniquePages: unique.size,
    browsedSite,
    visitedMarketing,
    visitedCareer,
    visitedFeed,
    formOnly: unique.size > 0 && !browsedSite,
    msToFirstCraft,
    firstCraftAt,
  };
}

const KNOWN_PATHS: Record<string, HuntPageKind> = {
  '/servicios': 'services',
  '/services': 'services',
  '/nosotros': 'about',
  '/about': 'about',
  '/casos': 'cases',
  '/casos-de-exito': 'cases',
  '/contacto': 'contact',
  '/contact': 'contact',
};

export function classifyHuntPage(
  path: string,
  host: string | null
): { kind: HuntPageKind; slug?: string } {
  const raw = (path || '/').split('?')[0]?.split('#')[0] || '/';
  const p = raw.replace(/\/+$/, '') || '/';
  if (urlLooksLikeFeed(p)) return { kind: 'feed' };
  if (/(^|\/)hallazgos$/i.test(p)) return { kind: 'findings' };
  if (/(^|\/)prueba$/i.test(p)) {
    const parts = p.split('/').filter(Boolean);
    const pruebaAt = parts.findIndex((part) => part.toLowerCase() === 'prueba');
    const slug = pruebaAt > 0 && parts[pruebaAt - 1]?.toLowerCase() !== 'empleos' ? parts[pruebaAt - 1] : undefined;
    return { kind: 'test', slug };
  }
  if (p.startsWith('/legal')) return { kind: 'legal' };
  if (KNOWN_PATHS[p]) return { kind: KNOWN_PATHS[p] };
  if (isCareerHost(host)) {
    if (p === '/') return { kind: 'jobs' };
    const parts = p.split('/').filter(Boolean);
    if (parts.length === 1) return { kind: 'job', slug: parts[0] };
  }
  if (p === '/empleos') return { kind: 'jobs' };
  if (p === '/') return { kind: 'home' };
  const job = p.match(/^\/empleos\/([^/]+)$/i);
  if (job?.[1]) return { kind: 'job', slug: job[1] };
  return { kind: 'other' };
}

function pathFromUrl(value: string): string {
  try {
    if (value.includes('://') || value.startsWith('//')) {
      return new URL(value.startsWith('//') ? `https:${value}` : value).pathname;
    }
  } catch {
    /* keep raw */
  }
  return value.split('?')[0]?.split('#')[0] || value;
}

function matchFindingTitle(
  event: HuntTrailEvent,
  reports: HuntTrailReport[],
  used: Set<number>
): string | null {
  const eventPath = (event.path || '').toLowerCase();
  const eventAt = new Date(event.created_at).getTime();
  let bestIndex = -1;
  let bestScore = Infinity;
  for (let index = 0; index < reports.length; index += 1) {
    const report = reports[index];
    if (!report || used.has(index) || !report.title) continue;
    const reportPath = pathFromUrl(report.page_url).toLowerCase();
    const samePath = reportPath === eventPath || report.page_url.toLowerCase().includes(eventPath);
    const delta = Math.abs(new Date(report.created_at).getTime() - eventAt);
    if (!samePath || delta > 60_000) continue;
    if (delta < bestScore) {
      bestIndex = index;
      bestScore = delta;
    }
  }
  if (bestIndex < 0) return null;
  used.add(bestIndex);
  return reports[bestIndex]?.title || null;
}

export function buildHuntTrailSteps(
  events: HuntTrailEvent[],
  reports: HuntTrailReport[] = []
): HuntTrailStep[] {
  const ordered = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const usedReports = new Set<number>();
  const merged: HuntTrailStep[] = [];
  const originMs = ordered[0] ? new Date(ordered[0].created_at).getTime() : 0;

  for (const event of ordered) {
    const kind = event.event_type === 'reported' ? 'reported' : 'page_view';
    const classified = classifyHuntPage(event.path, event.host);
    const last = merged[merged.length - 1];
    if (
      last &&
      last.kind === 'page_view' &&
      kind === 'page_view' &&
      last.path === event.path &&
      (last.host || '') === (event.host || '')
    ) {
      last.visits += 1;
      last.id = event.id || last.id;
      continue;
    }
    merged.push({
      id: event.id || `${event.created_at}-${merged.length}`,
      kind,
      at: event.created_at,
      elapsedMs: new Date(event.created_at).getTime() - originMs,
      dwellMs: null,
      visits: 1,
      path: event.path,
      host: event.host,
      referrer: event.referrer,
      pageKind: classified.kind,
      slug: classified.slug,
      surface: isCareerHost(event.host) ? 'career' : 'marketing',
      isForm: isHuntFormPath(event.path),
      isFeed: urlLooksLikeFeed(event.path) || urlLooksLikeFeed(event.referrer || ''),
      findingTitle: kind === 'reported' ? matchFindingTitle(event, reports, usedReports) : null,
    });
  }

  for (let i = 0; i < merged.length; i += 1) {
    const current = merged[i];
    const next = merged[i + 1];
    if (!current || !next) continue;
    current.dwellMs = new Date(next.at).getTime() - new Date(current.at).getTime();
  }
  return merged;
}

export function huntTrailRoute(steps: HuntTrailStep[]): HuntTrailRouteStop[] {
  const stops: HuntTrailRouteStop[] = [];
  const indexByKey = new Map<string, number>();
  for (const step of steps) {
    const key = pageKey(step.host, step.path);
    const existing = indexByKey.get(key);
    if (existing == null) {
      indexByKey.set(key, stops.length);
      stops.push({
        key,
        pageKind: step.pageKind,
        slug: step.slug,
        path: step.path,
        surface: step.surface,
        reported: step.kind === 'reported',
      });
    } else if (step.kind === 'reported') {
      const stop = stops[existing];
      if (stop) stop.reported = true;
    }
  }
  return stops;
}
