export const CAREER_DISCIPLINES = [
  'frontend',
  'backend',
  'fullstack',
  'ux-ui',
  'qa',
  'other',
] as const;

export type CareerDiscipline = (typeof CAREER_DISCIPLINES)[number];

export const CAREER_DISCIPLINE_LABELS: Record<CareerDiscipline, string> = {
  frontend: 'Tester frontend',
  backend: 'Tester backend',
  fullstack: 'Tester full stack',
  'ux-ui': 'Tester UX / UI',
  qa: 'Tester QA',
  other: 'Tester (otro oficio)',
};

export const CAREER_DISCIPLINE_CATALOG: Record<CareerDiscipline, string> = {
  frontend: 'tester-frontend',
  backend: 'tester-backend',
  fullstack: 'tester-fullstack',
  'ux-ui': 'tester-ux-ui',
  qa: 'tester-qa',
  other: 'tester-general',
};

export function isCareerDiscipline(value: string): value is CareerDiscipline {
  return (CAREER_DISCIPLINES as readonly string[]).includes(value);
}

/** PM no declara oficio; el resto de vacantes de entrega sí. */
export function postingAsksDiscipline(slug: string | null | undefined): boolean {
  return String(slug || '').trim().toLowerCase() !== 'project-manager';
}
