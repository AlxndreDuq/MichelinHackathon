import { Router } from 'express';
import { pool } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/auth.js';
import type { Route, Tier } from '../types/index.js';
import { computeRankInfo, computeBadges, POINTS_BY_TIER } from '../services/gamification.js';
import type { Badge } from '../services/gamification.js';

const router = Router();

export interface ProfileDto {
  name:         string;
  points:       number;
  rank:         string;
  rankPerk:     string;
  nextRank:     string | null;
  nextRankPerk: string | null;
  pointsToNext: number | null;
  progressPct:  number;
  badges:       Badge[];
}

export async function getProfileForUser(userId: number): Promise<ProfileDto | null> {
  const { rows: profiles } = await pool.query<{ id: number; name: string; points: number }>(
    'SELECT id, name, points FROM profile WHERE user_id = $1',
    [userId],
  );
  const profile = profiles[0];
  if (!profile) return null;

  const { rows: completions } = await pool.query<{ tier: Tier; department: string }>(
    `SELECT r.tier, r.dept AS department
     FROM route_completions rc
     JOIN routes r ON r.id = rc.route_id
     WHERE rc.profile_id = $1`,
    [profile.id],
  );

  const rankInfo = computeRankInfo(profile.points);
  const badges = computeBadges({ completions, points: profile.points, rank: rankInfo.rank });

  return { name: profile.name, points: profile.points, ...rankInfo, badges };
}

router.use(requireAuth);

router.get('/', async (req: AuthedRequest, res) => {
  try {
    const profile = await getProfileForUser(req.userId!);
    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/routes', async (req: AuthedRequest, res) => {
  try {
    const { rows: profiles } = await pool.query<{ id: number }>('SELECT id FROM profile WHERE user_id = $1', [req.userId]);
    const profile = profiles[0];
    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }

    const { rows } = await pool.query<Route>(
      `SELECT r.id, r.name, r.creator, r.tier, r.dist, r.deniv, r.time, r.stars,
              r.review_count AS "reviewCount", r.plays, r.hot, r.bike, r.note, r.dept
       FROM routes r
       JOIN profile_routes pr ON pr.route_id = r.id
       WHERE pr.profile_id = $1
       ORDER BY pr.sort_order`,
      [profile.id],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/routes/:id/complete', async (req: AuthedRequest, res) => {
  const routeId = req.params['id'];
  if (!routeId) { res.status(400).json({ error: 'Missing route id' }); return; }

  try {
    const { rows: profiles } = await pool.query<{ id: number }>('SELECT id FROM profile WHERE user_id = $1', [req.userId]);
    const profile = profiles[0];
    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }

    const { rows: routes } = await pool.query<{ tier: Tier }>('SELECT tier FROM routes WHERE id = $1', [routeId]);
    const route = routes[0];
    if (!route) { res.status(404).json({ error: 'Route not found' }); return; }

    const { rowCount } = await pool.query(
      'INSERT INTO route_completions (profile_id, route_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [profile.id, routeId],
    );

    const pointsAwarded = rowCount && rowCount > 0 ? POINTS_BY_TIER[route.tier] : 0;
    if (pointsAwarded > 0) {
      await pool.query('UPDATE profile SET points = points + $1 WHERE id = $2', [pointsAwarded, profile.id]);
    }

    const profileDto = await getProfileForUser(req.userId!);
    res.json({ profile: profileDto, pointsAwarded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
