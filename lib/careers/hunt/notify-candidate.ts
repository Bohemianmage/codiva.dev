import { sendClientEmail } from '@/lib/ops/email';
import { templateCareerHuntPartTwo, templateCareerApplyReady, templateCareerHuntNudge } from '@/lib/ops/email-templates';
import {
  careerDisciplineLabel,
  publicCareerHuntUrl,
  publicCareerPruebaUrl,
  publicCareerUrl,
} from '@/lib/ops/careers';
import { createAdminClient } from '@/lib/supabase/admin';
import { disciplineFromCatalogKey } from '@/lib/ops/career-disciplines';
import { huntRequiredForCatalog } from './seeds';

async function postingSlug(jobPostingId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from('ops_job_postings')
    .select('slug')
    .eq('id', jobPostingId)
    .maybeSingle();
  return data?.slug ? String(data.slug) : null;
}

export async function notifyCandidateHuntPartTwo(input: {
  email: string;
  name: string;
  catalogKey: string;
  jobPostingId: string;
}): Promise<void> {
  if (!huntRequiredForCatalog(input.catalogKey)) return;
  const discipline = disciplineFromCatalogKey(input.catalogKey);
  const slug = await postingSlug(input.jobPostingId);
  if (!slug) return;
  const craft = careerDisciplineLabel(discipline) || 'Tester';
  await sendClientEmail({
    to: input.email,
    subject: 'Siguiente: un hallazgo de tu oficio',
    html: templateCareerHuntPartTwo({
      name: input.name,
      craft,
      pruebaHref: publicCareerPruebaUrl(slug, discipline),
      huntHref: publicCareerHuntUrl(discipline),
    }),
  }).catch(() => {});
}

export async function notifyCandidateApplyReady(input: {
  email: string;
  name: string;
  catalogKey: string;
  jobPostingId: string;
}): Promise<void> {
  if (!huntRequiredForCatalog(input.catalogKey)) return;
  const discipline = disciplineFromCatalogKey(input.catalogKey);
  const slug = await postingSlug(input.jobPostingId);
  if (!slug) return;
  await sendClientEmail({
    to: input.email,
    subject: 'Ya puedes postular a Codiva.dev',
    html: templateCareerApplyReady({
      name: input.name,
      applyHref: discipline
        ? `${publicCareerUrl(slug)}?discipline=${encodeURIComponent(discipline)}`
        : publicCareerUrl(slug),
    }),
  }).catch(() => {});
}

export async function notifyCandidateHuntNudge(input: {
  email: string;
  name: string;
  catalogKey: string;
  jobPostingId: string;
}): Promise<void> {
  if (!huntRequiredForCatalog(input.catalogKey)) return;
  const discipline = disciplineFromCatalogKey(input.catalogKey);
  const slug = await postingSlug(input.jobPostingId);
  if (!slug) return;
  await sendClientEmail({
    to: input.email,
    subject: 'Cuando quieras, sigue con el hallazgo',
    html: templateCareerHuntNudge({
      name: input.name,
      pruebaHref: publicCareerPruebaUrl(slug, discipline),
      huntHref: publicCareerHuntUrl(discipline),
    }),
  }).catch(() => {});
}
