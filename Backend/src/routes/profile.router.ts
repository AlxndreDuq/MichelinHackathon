import { Router } from 'express';
import { pool } from '../db/client.js';
import type { Route } from '../types/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows: profiles } = await pool.query<{ id: number; name: string; rank: string; points: number; target: number }>(
      'SELECT id, name, rank, points, target FROM profile LIMIT 1',
    );
    const profile = profiles[0];
    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }

    const { rows: medals } = await pool.query<{ label: string; color: string; count: number }>(
      'SELECT label, color, count FROM medals WHERE profile_id = $1 ORDER BY sort_order',
      [profile.id],
    );

    res.json({ ...profile, medals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/routes', async (_req, res) => {
  try {
    const { rows: profiles } = await pool.query<{ id: number }>('SELECT id FROM profile LIMIT 1');
    const profile = profiles[0];
    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }

    const { rows } = await pool.query<Route>(
      `SELECT r.id, r.name, r.creator, r.tier, r.dist, r.deniv, r.time, r.stars,
              r.review_count AS "reviewCount", r.plays, r.hot, r.bike, r.note
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
