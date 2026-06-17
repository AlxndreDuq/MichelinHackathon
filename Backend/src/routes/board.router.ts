import { Router } from 'express';
import { pool } from '../db/client.js';
import type { BoardPlayer } from '../types/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const scope = req.query['scope'] === 'global' ? 'global' : 'mensuel';
  try {
    const { rows } = await pool.query<BoardPlayer>(
      'SELECT rank, name, initials, dept, points, you FROM board_players WHERE scope = $1 ORDER BY rank',
      [scope],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
