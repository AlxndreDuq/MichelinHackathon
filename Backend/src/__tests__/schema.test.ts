import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../db/client.js', () => ({
  pool: { query: vi.fn() },
}));

import { pool } from '../db/client.js';
import { ensureSchema } from '../db/schema.js';

const mockQuery = pool.query as unknown as Mock;

describe('ensureSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs a CREATE TABLE IF NOT EXISTS query', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await ensureSchema();

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql: string = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS routes');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS profile');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS route_completions');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS medals');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS route_leaderboard');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS board_players');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS reviews');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS profile_routes');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS products');
  });

  it('propagates pool errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('connection refused'));

    await expect(ensureSchema()).rejects.toThrow('connection refused');
  });
});
