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

const PROFILE_ROW = { id: 1, name: 'Léa M.', rank: 'Or', points: 3450, target: 5000 };
const MEDALS      = [
  { label: 'Or',     color: '#E8B43A', count: 4 },
  { label: 'Argent', color: '#B9BBC0', count: 9 },
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

  it('returns 200 with profile and medals', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PROFILE_ROW] })  // profile query
      .mockResolvedValueOnce({ rows: MEDALS });         // medals query

    const res = await request(makeApp()).get('/').set('Authorization', AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Léa M.', medals: MEDALS });
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

  it('returns 500 on DB error in medals query', async () => {
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
