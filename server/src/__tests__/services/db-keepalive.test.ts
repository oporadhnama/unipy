import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as dbModule from '../../db/index.js';
import { pingDatabase, startDbKeepalive, stopDbKeepalive } from '../../services/db-keepalive.js';

describe('db-keepalive service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopDbKeepalive();
  });

  afterEach(() => {
    stopDbKeepalive();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('pingDatabase returns ok=true when database responds', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      rows: [{ keepalive: 1, server_time: new Date() }],
    });

    vi.spyOn(dbModule, 'getDb').mockReturnValue({
      pool: { query: mockQuery },
    } as any);

    const res = await pingDatabase();
    expect(res.ok).toBe(true);
    expect(typeof res.latencyMs).toBe('number');
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1 AS keepalive, NOW() AS server_time');
  });

  it('pingDatabase returns ok=false when query rejects', async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error('Connection lost'));

    vi.spyOn(dbModule, 'getDb').mockReturnValue({
      pool: { query: mockQuery },
    } as any);

    const res = await pingDatabase();
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Connection lost');
  });

  it('startDbKeepalive runs heartbeats periodically and stopDbKeepalive halts them', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      rows: [{ keepalive: 1, server_time: new Date() }],
    });

    vi.spyOn(dbModule, 'getDb').mockReturnValue({
      pool: { query: mockQuery },
    } as any);

    startDbKeepalive(5000); // 5s interval

    // Initial timeout ping after 2000ms (before interval at 5000ms)
    await vi.advanceTimersByTimeAsync(2100);
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // First interval tick at 5000ms
    await vi.advanceTimersByTimeAsync(3000);
    expect(mockQuery).toHaveBeenCalledTimes(2);

    // Stop keepalive
    stopDbKeepalive();

    // After stopping, should not fire again
    await vi.advanceTimersByTimeAsync(10000);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
