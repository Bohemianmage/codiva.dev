import type { CareerDiscipline } from '@/lib/ops/career-disciplines';

export type HuntSurface = 'career' | 'marketing';
export type HuntDifficulty = 'easy' | 'medium' | 'hard';

export type HuntSeed = {
  id: string;
  title: string;
  surface: HuntSurface;
  /** Path prefixes that count, or ['*'] for any public page. */
  paths: string[];
  keywords: string[];
  /** Oficio dueño del hallazgo. Full stack cuenta front o back. */
  craft: CareerDiscipline;
  difficulty: HuntDifficulty;
};

export const HUNT_DIFFICULTY_POINTS: Record<HuntDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 4,
};

export const HUNT_SEEDS: HuntSeed[] = [
  {
    id: 'career-copyright-year',
    title: 'Copyright del pie en la bolsa con año fijo 2024',
    surface: 'career',
    paths: ['/empleos', '/'],
    keywords: ['2024', 'copyright', 'año', 'ano', 'year', 'pie', 'footer', 'reservados'],
    craft: 'qa',
    difficulty: 'easy',
  },
  {
    id: 'career-lang-en',
    title: 'Texto en inglés (lang=en) en la bolsa en español',
    surface: 'career',
    paths: ['/empleos', '/'],
    keywords: ['lang', 'idioma', 'inglés', 'ingles', 'english', 'open positions', 'i18n'],
    craft: 'ux-ui',
    difficulty: 'easy',
  },
  {
    id: 'career-mapa-404',
    title: 'Enlace «Mapa del sitio» a una ruta que no existe',
    surface: 'career',
    paths: ['/empleos', '/'],
    keywords: ['mapa', '404', 'enlace', 'roto', 'sitio', 'href', 'not found'],
    craft: 'qa',
    difficulty: 'easy',
  },
  {
    id: 'career-icon-unnamed',
    title: 'Control solo-ícono sin nombre accesible en el pie de la bolsa',
    surface: 'career',
    paths: ['/empleos', '/'],
    keywords: ['aria', 'nombre', 'accesib', 'botón', 'boton', 'icono', 'lector', 'label'],
    craft: 'ux-ui',
    difficulty: 'medium',
  },
  {
    id: 'footer-social-hit-targets',
    title: 'Iconos sociales con tamaños de clic distintos (22 / 20 / 18)',
    surface: 'marketing',
    paths: ['*'],
    keywords: ['icono', 'linkedin', 'github', 'instagram', 'tamaño', 'tamano', 'hit', 'target', '22', '20', '18', 'social'],
    craft: 'ux-ui',
    difficulty: 'medium',
  },
  {
    id: 'career-skip-mismatch',
    title: 'Skip link apunta a #contenido y el main no tiene ese id',
    surface: 'career',
    paths: ['/empleos', '/'],
    keywords: ['skip', 'saltar', 'contenido', 'ancla', 'id', 'accesib', 'teclado'],
    craft: 'frontend',
    difficulty: 'medium',
  },
  {
    id: 'nav-logo-not-keyboard',
    title: 'El wordmark del navbar es un div clicable, no un enlace: no se activa con teclado',
    surface: 'marketing',
    paths: ['*'],
    keywords: ['logo', 'teclado', 'enter', 'click', 'div', 'accesib', 'wordmark', 'navbar'],
    craft: 'frontend',
    difficulty: 'hard',
  },
  {
    id: 'career-feed-content-type',
    title: 'Feed JSON de vacantes con Content-Type text/html y campo enviroment mal escrito',
    surface: 'career',
    paths: ['/api/careers/feed', '/empleos'],
    keywords: [
      'feed',
      'json',
      'content-type',
      'content type',
      'html',
      'enviroment',
      'cabecera',
      'header',
      'api',
    ],
    craft: 'backend',
    difficulty: 'hard',
  },
  {
    id: 'career-feed-empty-jobs',
    title: 'El feed JSON dice jobs: [] mientras el listado de la bolsa sí muestra vacantes',
    surface: 'career',
    paths: ['/api/careers/feed', '/empleos'],
    keywords: ['feed', 'jobs', 'vacío', 'vacio', 'vacantes', 'listado', 'api', 'desfas', 'contrato'],
    craft: 'fullstack',
    difficulty: 'hard',
  },
];

export function huntSeedById(id: string): HuntSeed | null {
  return HUNT_SEEDS.find((s) => s.id === id) ?? null;
}

export function huntRequiredForCatalog(catalogKey: string | null | undefined): boolean {
  return String(catalogKey || '').startsWith('tester-');
}
