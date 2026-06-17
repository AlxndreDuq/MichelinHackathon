import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../db/client.js', () => ({
  pool: { query: vi.fn() },
}));

import request from 'supertest';
import express from 'express';
import { pool } from '../db/client.js';
import routesRouter from '../routes/routes.router.js';

const mockQuery = pool.query as unknown as Mock;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', routesRouter);
  return app;
}

const ROUTE = {
  id: 'lac', name: 'Tour du Lac', creator: '@thomas_velo',
  tier: 'vert', dist: 18, deniv: 320, time: '0h48',
  stars: 4, reviewCount: 64, plays: 3200, hot: true,
  bike: 'route', note: 'Super parcours',
};

const REVIEW = { name: 'Julien K.', initials: 'JK', stars: 5, comment: 'Top' };

const LB_ENTRY = { rank: 1, name: 'Marc D.', initials: 'MD', time: '0h48', you: false };

describe('GET /', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with all routes', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ROUTE] });

    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([ROUTE]);
  });

  it('returns 500 on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /reviews', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with reviews array', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [REVIEW] });

    const res = await request(makeApp()).get('/reviews');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([REVIEW]);
  });

  it('returns empty array when no reviews', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).get('/reviews');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/reviews');

    expect(res.status).toBe(500);
  });
});

describe('GET /:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with the matching route', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ROUTE] });

    const res = await request(makeApp()).get('/lac');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(ROUTE);
  });

  it('returns 404 when route is not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).get('/unknown');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 500 on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/lac');

    expect(res.status).toBe(500);
  });
});

describe('GET /:id/leaderboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with leaderboard entries', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [LB_ENTRY] });

    const res = await request(makeApp()).get('/lac/leaderboard');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([LB_ENTRY]);
  });

  it('returns 404 when leaderboard is empty', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).get('/unknown-route/leaderboard');

    expect(res.status).toBe(404);
  });

  it('returns 500 on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/lac/leaderboard');

    expect(res.status).toBe(500);
  });
});
