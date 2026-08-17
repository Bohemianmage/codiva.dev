import { createAdminClient } from '@/lib/supabase/admin';
import { ASSESSMENT_PASS_WINDOW_DAYS } from '@/lib/careers/assessments/engine';
import { disciplineFromCatalogKey, type CareerDiscipline } from '@/lib/ops/career-disciplines';
import { matchedSeedCountsForDiscipline } from './match';
import { huntRequiredForCatalog } from './seeds';
import { EMPTY_HUNT_SCORE, scoreHuntReports, type HuntScore } from './score';

export type HuntProgress = {
  required: boolean;
  ready: boolean;
  /** Primera vez que un hallazgo del oficio cerró la prueba. */
  readyAt: string | null;
  matched: number;
  needed: number;
  discipline: CareerDiscipline | null;
  score: HuntScore;
};

const HUNT_NEEDED = 1;

export async function huntProgressForAttempt(input: {
  email: string;
  catalogKey: string;
}): Promise<HuntProgress> {
  const discipline = disciplineFromCatalogKey(input.catalogKey);
  const required = huntRequiredForCatalog(input.catalogKey);
  if (!required || !discipline) {
    return {
      required: false,
      ready: true,
      readyAt: null,
      matched: 0,
      needed: 0,
      discipline,
      score: EMPTY_HUNT_SCORE,
    };
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - ASSESSMENT_PASS_WINDOW_DAYS * 24 * 3600 * 1000).toISOString();
  const { data } = await admin
    .from('ops_hunt_reports')
    .select('matched_seed_id, created_at')
    .ilike('email', input.email)
    .gte('created_at', cutoff);

  const rows = data ?? [];
  const matchingTimes = rows
    .filter((row) => matchedSeedCountsForDiscipline(row.matched_seed_id, discipline))
    .map((row) => String(row.created_at || ''))
    .filter(Boolean)
    .sort();
  const matched = matchingTimes.length;
  const score = scoreHuntReports(rows, discipline);

  return {
    required: true,
    ready: matched >= HUNT_NEEDED,
    readyAt: matched >= HUNT_NEEDED ? matchingTimes[0] : null,
    matched,
    needed: HUNT_NEEDED,
    discipline,
    score,
  };
}
