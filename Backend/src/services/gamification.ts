import type { Tier } from '../types/index.js';

export const POINTS_BY_TIER: Record<Tier, number> = {
  vert:  100,
  bleu:  200,
  rouge: 350,
  noir:  600,
};

interface RankDef {
  name:      string;
  threshold: number;
  perk:      string;
}

export const RANKS: RankDef[] = [
  { name: 'Bronze',  threshold: 0,    perk: 'Bienvenue dans le Défi Vélo !' },
  { name: 'Argent',  threshold: 500,  perk: '-10% sur les pneus MICHELIN' },
  { name: 'Or',      threshold: 1500, perk: '-15% sur les pneus MICHELIN' },
  { name: 'Légende', threshold: 3000, perk: '-20% sur les pneus MICHELIN + invitation événement MICHELIN' },
];

export interface RankInfo {
  rank:         string;
  rankPerk:     string;
  nextRank:     string | null;
  nextRankPerk: string | null;
  pointsToNext: number | null;
  progressPct:  number;
}

export function computeRankInfo(points: number): RankInfo {
  let current = RANKS[0]!;
  let next: RankDef | null = null;

  for (let i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i]!.threshold) {
      current = RANKS[i]!;
      next = RANKS[i + 1] ?? null;
    }
  }

  const progressPct = next
    ? Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100)
    : 100;

  return {
    rank:         current.name,
    rankPerk:     current.perk,
    nextRank:     next?.name ?? null,
    nextRankPerk: next?.perk ?? null,
    pointsToNext: next ? next.threshold - points : null,
    progressPct,
  };
}

export interface CompletionInfo {
  tier:       Tier;
  department: string;
}

export interface BadgeContext {
  completions: CompletionInfo[];
  points:      number;
  rank:        string;
}

export interface Badge {
  id:       string;
  label:    string;
  icon:     string;
  unlocked: boolean;
}

interface BadgeDef {
  id:    string;
  label: string;
  icon:  string;
  isUnlocked(ctx: BadgeContext): boolean;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'premier-tour',    label: 'Premier Tour',        icon: '🚴', isUnlocked: ctx => ctx.completions.length >= 1 },
  { id: 'rider-assidu',    label: 'Rider Assidu',        icon: '🔥', isUnlocked: ctx => ctx.completions.length >= 5 },
  { id: 'roi-montagne',    label: 'Roi de la Montagne',  icon: '⛰️', isUnlocked: ctx => ctx.completions.some(c => c.tier === 'noir') },
  { id: 'globe-trotter',   label: 'Globe-Trotter',       icon: '🌍', isUnlocked: ctx => new Set(ctx.completions.map(c => c.department)).size >= 3 },
  { id: 'legende-vivante', label: 'Légende Vivante',     icon: '👑', isUnlocked: ctx => ctx.rank === 'Légende' },
];

export function computeBadges(ctx: BadgeContext): Badge[] {
  return BADGE_DEFS.map(b => ({ id: b.id, label: b.label, icon: b.icon, unlocked: b.isUnlocked(ctx) }));
}
