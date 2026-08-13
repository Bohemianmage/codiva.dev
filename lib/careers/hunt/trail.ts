import { isCareerHost } from '@/lib/ops/host';
import { matchedSeedCountsForDiscipline } from './match';
import type { CareerDiscipline } from '@/lib/ops/career-disciplines';

export type HuntTrailEvent = {
  event_type: string;
  path: string;
  host: string | null;
  referrer: string | null;
  created_at: string;
};

export type HuntTrailReport = {
  matched_seed_id: string | null;
  page_url: string;
  created_at: string;
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
