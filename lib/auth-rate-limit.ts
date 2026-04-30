interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = store.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count++;
  return { allowed: true, retryAfterMs: 0 };
}
