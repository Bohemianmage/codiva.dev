import { describe, expect, it } from 'vitest';
import {
  summarizeHuntTrailForPartner,
  toInterviewPartnerBrief,
} from './interview-brief';
import type { RecruitingDossier } from '@/lib/careers/recruiting-report';
import type { HuntTrailQuality } from '@/lib/careers/hunt/trail';

const trail = (overrides: Partial<HuntTrailQuality> = {}): HuntTrailQuality => ({
  pageViews: 12,
  uniquePages: 5,
  browsedSite: true,
  visitedMarketing: false,
  visitedCareer: true,
  visitedFeed: true,
  formOnly: false,
  msToFirstCraft: 90_000,
  firstCraftAt: '2026-08-01T12:00:00.000Z',
  ...overrides,
});

const dossier = (overrides: Partial<RecruitingDossier> = {}): RecruitingDossier =>
  ({
    attemptId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    vacancy: 'Tester',
    craft: 'QA',
    status: 'completed',
    stage: 'applied',
    stageLabel: 'Con CV',
    passed: true,
    scorePct: 88,
    scoreCorrect: 8,
    scoreTotal: 10,
    attemptNumber: 1,
    durationLabel: '12 min 3s',
    blurCount: 2,
    startedAt: '2026-08-01T11:00:00.000Z',
    completedAt: '2026-08-01T11:12:00.000Z',
    applied: true,
    applicationStatusLabel: 'Entrevista',
    interviewLabel: 'Entrevista · 0/3',
    interviews: [],
    appliedAt: '2026-08-02T10:00:00.000Z',
    consideration: 'solid',
    considerationLabel: 'Sólida',
    craftHits: 2,
    findingsTotal: 3,
    difficultyMix: '1 fácil · 1 media',
    competencies: [
      { name: 'Reproducibilidad', ok: true },
      { name: 'Severidad', ok: false },
    ],
    findings: [
      {
        title: 'Login roto',
        pageUrl: 'https://codiva.dev/login',
        description: 'No entra con credenciales válidas.',
        expected: 'Debe autenticar.',
        counts: true,
        difficultyLabel: 'Media',
        evidenceCount: 1,
        createdAt: '2026-08-01T12:05:00.000Z',
        reviewDiscarded: false,
      },
    ],
    trail: trail(),
    trailRoute: 'home → login → findings',
    ...overrides,
  }) as RecruitingDossier;

describe('toInterviewPartnerBrief', () => {
  it('keeps evaluation detail and drops blur telemetry', () => {
    const brief = toInterviewPartnerBrief(dossier());
    expect(brief.passed).toBe(true);
    expect(brief.scorePct).toBe(88);
    expect(brief.craftHits).toBe(2);
    expect(brief.competencies).toHaveLength(2);
    expect(brief.findings[0]?.title).toBe('Login roto');
    expect(brief.trailSummary).toContain('Recorrió el sitio');
    expect(brief).not.toHaveProperty('blurCount');
    expect(brief).not.toHaveProperty('stage');
  });
});

describe('summarizeHuntTrailForPartner', () => {
  it('describes form-only trails', () => {
    expect(
      summarizeHuntTrailForPartner(
        trail({ formOnly: true, browsedSite: false, pageViews: 2, uniquePages: 1, msToFirstCraft: null })
      )
    ).toMatch(/formulario/i);
  });
});
