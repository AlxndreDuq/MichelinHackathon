import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../db/client.js', () => ({
  pool: { query: vi.fn() },
}));

import request from 'supertest';
import express from 'express';
import { pool } from '../db/client.js';
import boardRouter from '../routes/board.router.js';

const mockQuery = pool.query as unknown as Mock;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', boardRouter);
  return app;
}

const MENSUEL_PLAYER = { rank: 1, name: 'Marc D.', initials: 'MD', dept: null, points: 4850, you: false };
const GLOBAL_PLAYER  = { rank: 1, name: 'Antoine V.', initials: 'AV', dept: 'Savoie', points: 9840, you: false };

describe('GET /leaderboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns mensuel board by default', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [MENSUEL_PLAYER] });

    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([MENSUEL_PLAYER]);
    const [sql, params] = mockQuery.mock.calls[0] as [string, string[]];
    expect(params).toContain('mensuel');
  });

  it('returns mensuel board when scope is not "global"', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [MENSUEL_PLAYER] });

    const res = await request(makeApp()).get('/?scope=anything');

    expect(res.status).toBe(200);
    const [, params] = mockQuery.mock.calls[0] as [string, string[]];
    expect(params).toContain('mensuel');
  });

  it('returns global board when scope=global', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [GLOBAL_PLAYER] });

    const res = await request(makeApp()).get('/?scope=global');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([GLOBAL_PLAYER]);
    const [, params] = mockQuery.mock.calls[0] as [string, string[]];
    expect(params).toContain('global');
  });

  it('returns 500 on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/?scope=global');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('returns empty array when no players in scope', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).get('/?scope=mensuel');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
