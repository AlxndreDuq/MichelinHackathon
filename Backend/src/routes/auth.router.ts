import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/client.js';
import { signToken } from '../middleware/auth.js';
import { getProfileForUser } from './profile.router.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim()) { res.status(400).json({ error: 'Name is required' }); return; }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) { res.status(400).json({ error: 'Valid email is required' }); return; }
  if (typeof password !== 'string' || password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }

  const normalizedEmail = email.trim().toLowerCase();
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.length > 0) { res.status(409).json({ error: 'Email already registered' }); return; }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');
    const { rows: userRows } = await client.query<{ id: number }>(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [normalizedEmail, passwordHash],
    );
    const userId = userRows[0]!.id;

    await client.query(
      'INSERT INTO profile (user_id, name, rank, points, target) VALUES ($1, $2, $3, $4, $5)',
      [userId, name.trim(), 'Bronze', 0, 1000],
    );
    await client.query('COMMIT');

    const profile = await getProfileForUser(userId);
    res.status(201).json({ token: signToken(userId), profile });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const { rows } = await pool.query<{ id: number; password_hash: string }>(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email.trim().toLowerCase()],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const profile = await getProfileForUser(user.id);
    if (!profile) { res.status(500).json({ error: 'Profile missing for user' }); return; }

    res.json({ token: signToken(user.id), profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
