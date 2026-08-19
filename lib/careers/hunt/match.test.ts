import { describe, expect, it } from 'vitest';
import { matchHuntReport } from './match';

describe('matchHuntReport', () => {
  it('matches the career copyright seed on the career host', () => {
    const match = matchHuntReport({
      pageUrl: 'https://career.codiva.dev/',
      title: 'Copyright 2024 en el pie',
      description: 'El footer de la bolsa muestra derechos reservados con año fijo 2024.',
      discipline: 'qa',
    });
    expect(match?.seedId).toBe('career-copyright-year');
    expect(match?.countsForCraft).toBe(true);
  });

  it('does not count a career seed reported from marketing', () => {
    const match = matchHuntReport({
      pageUrl: 'https://codiva.dev/empleos',
      title: 'Copyright 2024 en el pie',
      description: 'El footer muestra derechos reservados con año fijo 2024.',
      discipline: 'qa',
    });
    expect(match).toBeNull();
  });

  it('matches the public feed debug key', () => {
    const match = matchHuntReport({
      pageUrl: 'https://career.codiva.dev/api/careers/feed',
      title: 'debug_api_key en el feed',
      description: 'El JSON público expone debug_api_key cdv_hunt_not_a_secret junto a jobs vacíos.',
      discipline: 'security',
    });
    expect(match?.seedId).toBe('career-feed-debug-key');
    expect(match?.countsForCraft).toBe(true);
  });

  it('returns null when there are no seed anchors', () => {
    const match = matchHuntReport({
      pageUrl: 'https://codiva.dev/',
      title: 'El botón es gris',
      description: 'No me gusta el color del CTA flotante en mobile.',
      discipline: 'ux-ui',
    });
    expect(match).toBeNull();
  });
});
