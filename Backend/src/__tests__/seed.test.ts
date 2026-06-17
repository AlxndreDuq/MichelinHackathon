import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../db/client.js', () => ({
  pool: {
    query:   vi.fn(),
    connect: vi.fn(),
  },
}));

import { pool } from '../db/client.js';
import { addMin, seedIfEmpty } from '../seed.js';

const mockQuery   = pool.query   as unknown as Mock;
const mockConnect = pool.connect as unknown as Mock;

// ─── addMin ──────────────────────────────────────────────────────────────────

describe('addMin', () => {
  it('returns the base time when adding 0', () => {
    expect(addMin('0h48', 0)).toBe('0h48');
  });

  it('pads minutes with a leading zero', () => {
    expect(addMin('1h00', 5)).toBe('1h05');
  });

  it('carries minutes into hours', () => {
    expect(addMin('0h48', 12)).toBe('1h00');
  });

  it('handles multi-hour base', () => {
    expect(addMin('2h15', 31)).toBe('2h46');
  });

  it('carries across the hour boundary from a non-zero minute base', () => {
    expect(addMin('1h55', 10)).toBe('2h05');
  });

  it('adds large offsets correctly', () => {
    expect(addMin('0h48', 49)).toBe('1h37');
  });
});

// ─── seedIfEmpty ─────────────────────────────────────────────────────────────

describe('seedIfEmpty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips seed when both routes and profile are populated', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '8' }] })   // routes count
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });  // profile count

    await seedIfEmpty();

    // Only the 2 COUNT queries, no insertAll
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('runs insertAll when routes table is empty', async () => {
    // seedIfEmpty queries
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })   // routes count
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });  // profile count

    // insertAll uses pool.connect() → client
    const mockClient = {
      query:   vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
      release: vi.fn(),
    };
    mockConnect.mockResolvedValueOnce(mockClient);

    await seedIfEmpty();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    // BEGIN + TRUNCATE + many INSERTs + COMMIT
    expect(mockClient.query.mock.calls.length).toBeGreaterThan(10);
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('runs insertAll when routes is populated but profile is empty (migration)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '8' }] })   // routes count
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });  // profile count

    const mockClient = {
      query:   vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
      release: vi.fn(),
    };
    mockConnect.mockResolvedValueOnce(mockClient);

    await seedIfEmpty();

    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('propagates DB errors from seedIfEmpty', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));

    await expect(seedIfEmpty()).rejects.toThrow('DB down');
  });

  it('rolls back transaction on insertAll failure', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });

    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce(undefined)               // BEGIN
        .mockRejectedValueOnce(new Error('insert fail')) // TRUNCATE fails
        .mockResolvedValueOnce(undefined),              // ROLLBACK
      release: vi.fn(),
    };
    mockConnect.mockResolvedValueOnce(mockClient);

    await expect(seedIfEmpty()).rejects.toThrow('insert fail');
    const calls = mockClient.query.mock.calls.map((c: unknown[]) => String(c[0]).trim().split(/\s+/)[0]);
    expect(calls).toContain('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
