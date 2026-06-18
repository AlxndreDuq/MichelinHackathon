import { Router } from 'express';
import { pool } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/auth.js';
import type { Route } from '../types/index.js';

const router = Router();

export interface ProfileDto {
  name: string;
  rank: string;
  points: number;
  target: number;
  medals: { label: string; color: string; count: number }[];
}

export async function getProfileForUser(userId: number): Promise<ProfileDto | null> {
  const { rows: profiles } = await pool.query<{ id: number; name: string; rank: string; points: number; target: number }>(
    'SELECT id, name, rank, points, target FROM profile WHERE user_id = $1',
    [userId],
  );
  const profile = profiles[0];
  if (!profile) return null;

  const { rows: medals } = await pool.query<{ label: string; color: string; count: number }>(
    'SELECT label, color, count FROM medals WHERE profile_id = $1 ORDER BY sort_order',
    [profile.id],
  );

  return { name: profile.name, rank: profile.rank, points: profile.points, target: profile.target, medals };
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

export default router;
