import { createAdminClient } from '@/lib/supabase/admin';
import { ASSESSMENT_PASS_WINDOW_DAYS } from '@/lib/careers/assessments/engine';
import { disciplineFromCatalogKey, type CareerDiscipline } from '@/lib/ops/career-disciplines';
import { matchedSeedCountsForDiscipline } from './match';
import { huntRequiredForCatalog } from './seeds';
import { EMPTY_HUNT_SCORE, scoreHuntReports, type HuntScore } from './score';

export type HuntProgress = {
  required: boolean;
  ready: boolean;
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
    return { required: false, ready: true, matched: 0, needed: 0, discipline, score: EMPTY_HUNT_SCORE };
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - ASSESSMENT_PASS_WINDOW_DAYS * 24 * 3600 * 1000).toISOString();
  const { data } = await admin
    .from('ops_hunt_reports')
    .select('matched_seed_id')
    .ilike('email', input.email)
    .gte('created_at', cutoff);

  const rows = data ?? [];
  const matched = rows.filter((row) =>
    matchedSeedCountsForDiscipline(row.matched_seed_id, discipline)
  ).length;
  const score = scoreHuntReports(rows, discipline);

  return {
    required: true,
    ready: matched >= HUNT_NEEDED,
    matched,
    needed: HUNT_NEEDED,
    discipline,
    score,
  };
}
