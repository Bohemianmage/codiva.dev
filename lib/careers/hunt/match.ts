import {
  CAREER_DISCIPLINES,
  isCareerDiscipline,
  type CareerDiscipline,
} from '@/lib/ops/career-disciplines';
import { HUNT_SEEDS, huntSeedById, type HuntSeed } from './seeds';

function normalizePath(raw: string): string {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const url = value.includes('://') ? new URL(value) : new URL(value, 'https://career.codiva.dev');
    let path = url.pathname.replace(/\/+$/, '') || '/';
    const host = url.hostname.toLowerCase();
    if (host.startsWith('career.') && path === '/') path = '/empleos';
    return path.toLowerCase();
  } catch {
    const path = value.split('?')[0]?.toLowerCase() || '';
    return path.startsWith('/') ? path.replace(/\/+$/, '') || '/' : `/${path}`;
  }
}

function pathMatches(seed: HuntSeed, path: string): boolean {
  if (seed.paths.includes('*')) return true;
  return seed.paths.some((prefix) => {
    const p = prefix.replace(/\/+$/, '') || '/';
    if (p === '/') return path === '/' || path === '/empleos';
    return path === p || path.startsWith(`${p}/`);
  });
}

function keywordHits(seed: HuntSeed, blob: string): number {
  return seed.keywords.filter((kw) => blob.includes(kw.toLowerCase())).length;
}

/** Oficio dueño + full stack (front o back) + «otro» (cualquiera). */
export function craftsCountedFor(discipline: CareerDiscipline): CareerDiscipline[] {
  if (discipline === 'fullstack') return ['frontend', 'backend', 'fullstack'];
  if (discipline === 'other') return [...CAREER_DISCIPLINES];
  return [discipline];
}

export function seedCountsForDiscipline(seed: HuntSeed, discipline: CareerDiscipline): boolean {
  return craftsCountedFor(discipline).includes(seed.craft);
}

export function matchedSeedCountsForDiscipline(
  seedId: string | null | undefined,
  discipline: CareerDiscipline
): boolean {
  const seed = seedId ? huntSeedById(seedId) : null;
  return Boolean(seed && seedCountsForDiscipline(seed, discipline));
}

export type HuntMatch = {
  seedId: string;
  title: string;
  craft: CareerDiscipline;
  countsForCraft: boolean;
  score: number;
};

export function matchHuntReport(input: {
  pageUrl: string;
  title: string;
  description: string;
  discipline?: string | null;
}): HuntMatch | null {
  const path = normalizePath(input.pageUrl);
  const blob = `${input.title} ${input.description} ${path}`.toLowerCase();
  const rawDiscipline = input.discipline ?? '';
  const discipline = isCareerDiscipline(rawDiscipline) ? rawDiscipline : null;
  let best: HuntMatch | null = null;
  for (const seed of HUNT_SEEDS) {
    if (!pathMatches(seed, path)) continue;
    const hits = keywordHits(seed, blob);
    if (hits < 2) continue;
    const countsForCraft = discipline ? seedCountsForDiscipline(seed, discipline) : false;
    const score =
      hits * 10 + (seed.paths.includes('*') ? 0 : 5) + (countsForCraft ? 20 : 0);
    if (!best || score > best.score) {
      best = {
        seedId: seed.id,
        title: seed.title,
        craft: seed.craft,
        countsForCraft,
        score,
      };
    }
  }
  return best;
}
