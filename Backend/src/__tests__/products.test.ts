import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../db/client.js', () => ({
  pool: { query: vi.fn() },
}));

import request from 'supertest';
import express from 'express';
import { pool } from '../db/client.js';
import productsRouter from '../routes/products.router.js';

const mockQuery = pool.query as unknown as Mock;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', productsRouter);
  return app;
}

const PRODUCT_ROW = {
  id: 'tire-michelin-power-cup-s-racing-line',
  name: 'Power Cup S',
  bike: 'route',
  tagline: 'Racing',
  eanCode: '3528705318383',
  url: 'https://www.michelin.fr',
};

describe('GET /products', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with all products', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [PRODUCT_ROW] });

    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([PRODUCT_ROW]);
  });

  it('returns empty array when no products exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(makeApp()).get('/');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
