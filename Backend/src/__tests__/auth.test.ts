import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../db/client.js', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

import bcrypt from 'bcryptjs';
import request from 'supertest';
import express from 'express';
import { pool } from '../db/client.js';
import authRouter from '../routes/auth.router.js';

const mockQuery   = pool.query   as unknown as Mock;
const mockConnect = pool.connect as unknown as Mock;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', authRouter);
  return app;
}

describe('POST /register', () => {
  beforeEach(() => vi.clearAllMocks());

  function makeClient() {
    return {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [] })                 // existing email check
        .mockResolvedValueOnce(undefined)                    // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 7 }] })         // INSERT users
        .mockResolvedValueOnce(undefined)                    // INSERT profile
        .mockResolvedValueOnce(undefined),                   // COMMIT
      release: vi.fn(),
    };
  }

  it('rejects a missing name', async () => {
    const res = await request(makeApp()).post('/register').send({ email: 'a@b.com', password: 'secret1' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid email', async () => {
    const res = await request(makeApp()).post('/register').send({ name: 'A', email: 'not-an-email', password: 'secret1' });
    expect(res.status).toBe(400);
  });

  it('rejects a short password', async () => {
    const res = await request(makeApp()).post('/register').send({ name: 'A', email: 'a@b.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('returns 409 when the email is already registered', async () => {
    const client = { query: vi.fn().mockResolvedValueOnce({ rows: [{ id: 1 }] }), release: vi.fn() };
    mockConnect.mockResolvedValueOnce(client);

    const res = await request(makeApp()).post('/register').send({ name: 'A', email: 'a@b.com', password: 'secret1' });

    expect(res.status).toBe(409);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('creates a user + fresh profile and returns a token', async () => {
    const client = makeClient();
    mockConnect.mockResolvedValueOnce(client);
    // getProfileForUser() call after commit uses pool.query, not the client
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42, name: 'A', rank: 'Bronze', points: 0, target: 1000 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).post('/register').send({ name: 'A', email: 'a@b.com', password: 'secret1' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.profile).toMatchObject({ name: 'A', rank: 'Bronze', points: 0, target: 1000, medals: [] });
  });
});

describe('POST /login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a missing email/password', async () => {
    const res = await request(makeApp()).post('/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for an unknown email', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(makeApp()).post('/login').send({ email: 'nobody@b.com', password: 'secret1' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for a wrong password', async () => {
    const hash = bcrypt.hashSync('correct-password', 4);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, password_hash: hash }] });

    const res = await request(makeApp()).post('/login').send({ email: 'a@b.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('returns 200 with a token and profile on success', async () => {
    const hash = bcrypt.hashSync('correct-password', 4);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, password_hash: hash }] })                          // user lookup
      .mockResolvedValueOnce({ rows: [{ id: 9, name: 'Léa M.', rank: 'Or', points: 3450, target: 5000 }] }) // profile
      .mockResolvedValueOnce({ rows: [{ label: 'Or', color: '#E8B43A', count: 4 }] });             // medals

    const res = await request(makeApp()).post('/login').send({ email: 'a@b.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.profile).toMatchObject({ name: 'Léa M.', rank: 'Or' });
  });
});
