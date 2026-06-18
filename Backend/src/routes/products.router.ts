import { Router } from 'express';
import { pool } from '../db/client.js';
import type { Product } from '../types/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query<Product>(
      'SELECT id, name, bike, tagline, ean_code AS "eanCode", url FROM products ORDER BY name',
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
