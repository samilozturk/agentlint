import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit } from "@/server/security/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows first request and returns remaining = max - 1", () => {
    const result = checkRateLimit("test-first", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.retryAfterMs).toBe(0);
  });

  it("allows requests up to the max within the window", () => {
    const key = "test-up-to-max";
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("remaining decreases with each request", () => {
    const key = "test-remaining";
    const r1 = checkRateLimit(key, 3, 60_000);
    expect(r1.remaining).toBe(2);
    const r2 = checkRateLimit(key, 3, 60_000);
    expect(r2.remaining).toBe(1);
    const r3 = checkRateLimit(key, 3, 60_000);
    expect(r3.remaining).toBe(0);
  });

  it("blocks request exceeding max with retryAfterMs > 0", () => {
    const key = "test-exceed";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000);
    }
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets window after expiry", () => {
    const key = "test-reset";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 1_000);
    }
    const blocked = checkRateLimit(key, 3, 1_000);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(1_001);

    const afterReset = checkRateLimit(key, 3, 1_000);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(2);
  });

  it("uses separate windows for different keys", () => {
    for (let i = 0; i < 2; i++) {
      checkRateLimit("key-a", 2, 60_000);
    }
    const blockedA = checkRateLimit("key-a", 2, 60_000);
    expect(blockedA.allowed).toBe(false);

    const allowedB = checkRateLimit("key-b", 2, 60_000);
    expect(allowedB.allowed).toBe(true);
  });
});
