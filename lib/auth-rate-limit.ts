import { getRedis, isRedisConfigured } from "@/lib/redis";

/**
 * Rate limiting for the admin login.
 *
 * This was a Map in module scope, which meant two things. It died on every cold start, and each
 * serverless instance kept its own copy — so "five attempts per minute" was really five attempts
 * per minute per instance, and the platform is free to run as many instances as it likes. The
 * ceiling was whatever concurrency the attacker could provoke. Redis makes the count one number
 * that every instance increments.
 *
 * Two separate limits, because they stop different things:
 *
 *   - Failures, counted over a long window. This is the brute-force limit. Only wrong passwords
 *     count, so your own successful logins never bring you closer to a lockout.
 *   - Attempts, counted over a short window regardless of outcome. bcrypt is deliberately slow,
 *     which makes an unauthenticated endpoint that runs it a way to burn server CPU. This caps
 *     that independently of whether the guesses are wrong.
 *
 * Known residual risk: both are keyed by IP, and an attacker with many addresses gets a fresh
 * budget per address. A global cap would close that, but it would also hand any stranger a way to
 * lock you out of your own site, which is a worse trade for a personal portfolio. What actually
 * carries the weight here is a bcrypt hash and a strong password; this limiter is there to make
 * online guessing impractical, not to be the only wall.
 */

const MAX_FAILURES = 8;
const FAILURE_WINDOW_S = 15 * 60;

const MAX_ATTEMPTS = 20;
const ATTEMPT_WINDOW_S = 60;

export interface RateLimitVerdict {
  allowed: boolean;
  retryAfterMs: number;
}

const ALLOWED: RateLimitVerdict = { allowed: true, retryAfterMs: 0 };

// ── In-memory fallback ────────────────────────────────────────────────────────
// Used when Redis is not configured, which locally is the normal case. Same weaknesses as before,
// but it is now the fallback rather than the mechanism.

interface Bucket {
  count: number;
  resetAt: number;
}
const memory = new Map<string, Bucket>();

function memoryHit(key: string, limit: number, windowS: number): RateLimitVerdict {
  const now = Date.now();
  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowS * 1000 });
    return ALLOWED;
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count++;
  return ALLOWED;
}

// ── Redis ─────────────────────────────────────────────────────────────────────

/**
 * Increment a fixed window and report whether it has been exhausted.
 *
 * INCR then EXPIRE on first write: the key carries its own window, so there is nothing to sweep up
 * and no stale bucket to reason about.
 */
async function redisHit(key: string, limit: number, windowS: number): Promise<RateLimitVerdict> {
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowS);

  if (count > limit) {
    const ttl = await redis.ttl(key);
    // A missing or already-expired TTL would otherwise report a negative wait.
    return { allowed: false, retryAfterMs: Math.max(1, ttl) * 1000 };
  }
  return ALLOWED;
}

async function hit(key: string, limit: number, windowS: number): Promise<RateLimitVerdict> {
  if (!isRedisConfigured()) return memoryHit(key, limit, windowS);
  try {
    return await redisHit(key, limit, windowS);
  } catch (e) {
    // Redis being unreachable must not make the login unusable, and must not silently remove the
    // limit either. Falling back keeps a limit in force on this instance at least.
    console.error("[auth-rate-limit] Redis unavailable, falling back to in-memory:", e);
    return memoryHit(key, limit, windowS);
  }
}

const attemptKey = (ip: string) => `auth:attempts:${ip}`;
const failureKey = (ip: string) => `auth:failures:${ip}`;

/**
 * Call before checking the password. Counts the attempt and reports whether this caller is already
 * locked out, either for too many recent failures or too many recent requests.
 */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitVerdict> {
  const attempts = await hit(attemptKey(ip), MAX_ATTEMPTS, ATTEMPT_WINDOW_S);
  if (!attempts.allowed) return attempts;

  // Read the failure count without incrementing it — a failure is recorded only when one happens.
  if (isRedisConfigured()) {
    try {
      const redis = getRedis();
      const failures = Number((await redis.get<number>(failureKey(ip))) ?? 0);
      if (failures >= MAX_FAILURES) {
        const ttl = await redis.ttl(failureKey(ip));
        return { allowed: false, retryAfterMs: Math.max(1, ttl) * 1000 };
      }
    } catch (e) {
      console.error("[auth-rate-limit] failure lookup failed:", e);
    }
  } else {
    const bucket = memory.get(failureKey(ip));
    if (bucket && bucket.resetAt > Date.now() && bucket.count >= MAX_FAILURES) {
      return { allowed: false, retryAfterMs: bucket.resetAt - Date.now() };
    }
  }

  return ALLOWED;
}

/** Call when a password was wrong. */
export async function recordLoginFailure(ip: string): Promise<void> {
  await hit(failureKey(ip), MAX_FAILURES, FAILURE_WINDOW_S);
}

/**
 * Call when a password was right. Clears the failure count so a few fat-fingered attempts followed
 * by a correct one leave nothing behind.
 */
export async function clearLoginFailures(ip: string): Promise<void> {
  if (!isRedisConfigured()) {
    memory.delete(failureKey(ip));
    return;
  }
  try {
    await getRedis().del(failureKey(ip));
  } catch (e) {
    console.error("[auth-rate-limit] could not clear failures:", e);
  }
}
