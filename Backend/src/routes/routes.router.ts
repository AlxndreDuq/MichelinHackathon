import { Router } from 'express';
import { pool } from '../db/client.js';
import type { Route, LeaderboardEntry, Review } from '../types/index.js';

const router = Router();

const SELECT_ROUTE = `
  SELECT id, name, creator, tier, dist, deniv, time, stars,
         review_count AS "reviewCount", plays, hot, bike, note
  FROM routes
`;

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query<Route>(SELECT_ROUTE + 'ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/reviews', async (_req, res) => {
  try {
    const { rows } = await pool.query<Review>(
      'SELECT name, initials, stars, comment FROM reviews ORDER BY id',
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id/leaderboard', async (req, res) => {
  const id = req.params['id'];
  if (!id) { res.status(400).json({ error: 'Missing id' }); return; }
  try {
    const { rows } = await pool.query<LeaderboardEntry>(
      'SELECT rank, name, initials, time, you FROM route_leaderboard WHERE route_id = $1 ORDER BY rank',
      [id],
    );
    if (rows.length === 0) { res.status(404).json({ error: 'Route not found' }); return; }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params['id'];
  if (!id) { res.status(400).json({ error: 'Missing id' }); return; }
  try {
    const { rows } = await pool.query<Route>(SELECT_ROUTE + 'WHERE id = $1', [id]);
    const route = rows[0];
    if (!route) { res.status(404).json({ error: 'Route not found' }); return; }
    res.json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
