import { describe, it, expect } from 'vitest';
import { computeRankInfo, computeBadges } from '../services/gamification.js';

describe('computeRankInfo', () => {
  it('starts at Bronze with 0 points', () => {
    expect(computeRankInfo(0)).toMatchObject({
      rank: 'Bronze', nextRank: 'Argent', pointsToNext: 500, progressPct: 0,
    });
  });

  it('computes progress within the current band', () => {
    expect(computeRankInfo(250)).toMatchObject({ rank: 'Bronze', progressPct: 50 });
  });

  it('promotes exactly at a threshold boundary', () => {
    expect(computeRankInfo(500)).toMatchObject({
      rank: 'Argent', nextRank: 'Or', pointsToNext: 1000, progressPct: 0,
    });
  });

  it('computes the Or band correctly', () => {
    expect(computeRankInfo(1650)).toMatchObject({
      rank: 'Or', nextRank: 'Légende', pointsToNext: 1350, progressPct: 10,
    });
  });

  it('maxes out at Légende with no further next rank', () => {
    expect(computeRankInfo(3000)).toMatchObject({
      rank: 'Légende', nextRank: null, nextRankPerk: null, pointsToNext: null, progressPct: 100,
    });
  });

  it('stays maxed out for arbitrarily large point totals', () => {
    expect(computeRankInfo(999999)).toMatchObject({ rank: 'Légende', progressPct: 100 });
  });
});

describe('computeBadges', () => {
  const base = { completions: [], points: 0, rank: 'Bronze' };

  it('unlocks nothing with no completions', () => {
    const badges = computeBadges(base);
    expect(badges.every(b => !b.unlocked)).toBe(true);
  });

  it('unlocks "premier-tour" after one completion', () => {
    const badges = computeBadges({ ...base, completions: [{ tier: 'vert', department: 'Isère' }] });
    expect(badges.find(b => b.id === 'premier-tour')?.unlocked).toBe(true);
    expect(badges.find(b => b.id === 'rider-assidu')?.unlocked).toBe(false);
  });

  it('unlocks "rider-assidu" at 5 completions', () => {
    const completions = Array.from({ length: 5 }, () => ({ tier: 'vert' as const, department: 'Isère' }));
    const badges = computeBadges({ ...base, completions });
    expect(badges.find(b => b.id === 'rider-assidu')?.unlocked).toBe(true);
  });

  it('unlocks "roi-montagne" only with a noir-tier completion', () => {
    const without = computeBadges({ ...base, completions: [{ tier: 'rouge', department: 'Isère' }] });
    const withNoir = computeBadges({ ...base, completions: [{ tier: 'noir', department: 'Isère' }] });
    expect(without.find(b => b.id === 'roi-montagne')?.unlocked).toBe(false);
    expect(withNoir.find(b => b.id === 'roi-montagne')?.unlocked).toBe(true);
  });

  it('unlocks "globe-trotter" once 3 distinct departments are covered', () => {
    const twoDepts = computeBadges({
      ...base,
      completions: [{ tier: 'vert', department: 'Isère' }, { tier: 'vert', department: 'Savoie' }],
    });
    const threeDepts = computeBadges({
      ...base,
      completions: [
        { tier: 'vert', department: 'Isère' },
        { tier: 'vert', department: 'Savoie' },
        { tier: 'vert', department: 'Ain' },
      ],
    });
    expect(twoDepts.find(b => b.id === 'globe-trotter')?.unlocked).toBe(false);
    expect(threeDepts.find(b => b.id === 'globe-trotter')?.unlocked).toBe(true);
  });

  it('unlocks "legende-vivante" only when rank is Légende', () => {
    const or = computeBadges({ ...base, rank: 'Or' });
    const legende = computeBadges({ ...base, rank: 'Légende' });
    expect(or.find(b => b.id === 'legende-vivante')?.unlocked).toBe(false);
    expect(legende.find(b => b.id === 'legende-vivante')?.unlocked).toBe(true);
  });
});
