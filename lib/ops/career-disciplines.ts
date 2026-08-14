import { tSync } from '@/i18n/translate';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

export const CAREER_DISCIPLINES = [
  'frontend',
  'backend',
  'fullstack',
  'ux-ui',
  'qa',
  'security',
  'other',
] as const;

export type CareerDiscipline = (typeof CAREER_DISCIPLINES)[number];

export const CAREER_DISCIPLINE_LABELS: Record<CareerDiscipline, string> = {
  frontend: 'Tester frontend',
  backend: 'Tester backend',
  fullstack: 'Tester full stack',
  'ux-ui': 'Tester UX / UI',
  qa: 'Tester QA',
  security: 'Tester de seguridad',
  other: 'Tester (otro oficio)',
};

export function careerDisciplineLabel(
  discipline: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE
): string | null {
  if (!discipline || !isCareerDiscipline(discipline)) return null;
  return tSync(locale, `career.tester.${discipline}`);
}

export function careerDisciplineLabels(locale: Locale = DEFAULT_LOCALE): Record<CareerDiscipline, string> {
  return Object.fromEntries(
    CAREER_DISCIPLINES.map((key) => [key, tSync(locale, `career.tester.${key}`)])
  ) as Record<CareerDiscipline, string>;
}

export const CAREER_DISCIPLINE_CATALOG: Record<CareerDiscipline, string> = {
  frontend: 'tester-frontend',
  backend: 'tester-backend',
  fullstack: 'tester-fullstack',
  'ux-ui': 'tester-ux-ui',
  qa: 'tester-qa',
  security: 'tester-security',
  other: 'tester-general',
};

export function isCareerDiscipline(value: string): value is CareerDiscipline {
  return (CAREER_DISCIPLINES as readonly string[]).includes(value);
}

export function disciplineFromCatalogKey(key: string | null | undefined): CareerDiscipline | null {
  const catalogKey = String(key || '').trim();
  const found = (Object.entries(CAREER_DISCIPLINE_CATALOG) as [CareerDiscipline, string][]).find(
    ([, value]) => value === catalogKey
  );
  return found?.[0] ?? null;
}

/** PM no declara oficio; el resto de vacantes de entrega sí. */
export function postingAsksDiscipline(slug: string | null | undefined): boolean {
  return String(slug || '').trim().toLowerCase() !== 'project-manager';
}
