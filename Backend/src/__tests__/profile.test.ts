import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../db/client.js', () => ({
  pool: { query: vi.fn() },
}));

import request from 'supertest';
import express from 'express';
import { pool } from '../db/client.js';
import { signToken } from '../middleware/auth.js';
import profileRouter from '../routes/profile.router.js';

const mockQuery = pool.query as unknown as Mock;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', profileRouter);
  return app;
}

const AUTH_HEADER = `Bearer ${signToken(1)}`;

const PROFILE_ROW = { id: 1, name: 'Léa M.', points: 1650 };
const COMPLETIONS = [
  { tier: 'vert',  department: 'Isère' },
  { tier: 'bleu',  department: 'Savoie' },
  { tier: 'rouge', department: 'Drôme' },
  { tier: 'bleu',  department: 'Isère' },
  { tier: 'bleu',  department: 'Isère' },
  { tier: 'noir',  department: 'Isère' },
];
const ROUTE_ROW = {
  id: 'cretes', name: 'Crêtes du Vercors', creator: '@marc_alpin',
  tier: 'rouge', dist: 42, deniv: 1200, time: '2h15',
  stars: 5, reviewCount: 128, plays: 2400, hot: true,
  bike: 'route', note: 'Top parcours',
};

describe('GET /profile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no token is provided', async () => {
    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 200 with the computed rank and badges', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PROFILE_ROW] })   // profile query
      .mockResolvedValueOnce({ rows: COMPLETIONS });     // completions query

    const res = await request(makeApp()).get('/').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Léa M.',
      points: 1650,
      rank: 'Or',
      nextRank: 'Légende',
      pointsToNext: 1350,
      progressPct: 10,
    });
    const unlocked = (res.body.badges as { id: string; unlocked: boolean }[])
      .filter(b => b.unlocked).map(b => b.id);
    expect(unlocked.sort()).toEqual(['globe-trotter', 'premier-tour', 'rider-assidu', 'roi-montagne'].sort());
  });

  it('returns 404 when no profile exists', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).get('/').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 500 on DB error in profile query', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(500);
  });

  it('returns 500 on DB error in completions query', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PROFILE_ROW] })
      .mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(500);
  });
});

describe('GET /profile/routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no token is provided', async () => {
    const res = await request(makeApp()).get('/routes');

    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 200 with the profile published routes', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })    // profile id query
      .mockResolvedValueOnce({ rows: [ROUTE_ROW] });    // routes JOIN query

    const res = await request(makeApp()).get('/routes').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([ROUTE_ROW]);
  });

  it('returns 404 when profile does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).get('/routes').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(404);
  });

  it('returns 500 on DB error in profile query', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/routes').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(500);
  });

  it('returns 500 on DB error in routes query', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/routes').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(500);
  });

  it('returns empty array when profile has no published routes', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).get('/routes').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /routes/:id/complete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no token is provided', async () => {
    const res = await request(makeApp()).post('/routes/cretes/complete');

    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('awards points on first completion', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })              // profile lookup
      .mockResolvedValueOnce({ rows: [{ tier: 'bleu' }] })       // route lookup
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })          // INSERT (new row)
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })          // UPDATE points
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test', points: 200 }] }) // getProfileForUser: profile
      .mockResolvedValueOnce({ rows: [{ tier: 'bleu', department: 'Isère' }] }); // getProfileForUser: completions

    const res = await request(makeApp()).post('/routes/foret/complete').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.pointsAwarded).toBe(200);
    expect(res.body.profile.points).toBe(200);
  });

  it('awards no points when the route was already completed', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ tier: 'bleu' }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })          // INSERT conflicts — already exists
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test', points: 200 }] })
      .mockResolvedValueOnce({ rows: [{ tier: 'bleu', department: 'Isère' }] });

    const res = await request(makeApp()).post('/routes/foret/complete').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.pointsAwarded).toBe(0);
  });

  it('returns 404 when the route does not exist', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).post('/routes/unknown/complete').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(404);
  });

  it('returns 404 when the profile does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).post('/routes/cretes/complete').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(404);
  });
});
