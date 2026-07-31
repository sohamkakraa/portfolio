import { getRedis, isRedisConfigured } from "@/lib/redis";

/**
 * A registry of the sessions that are still allowed to be used.
 *
 * The session cookie is a signed JWT, which is self-validating: the server can confirm it issued
 * the token and that it has not expired, and that is all. It cannot take one back. Signing out
 * deleted the cookie from the browser and nothing else, so the token itself stayed valid for its
 * full thirty days — anyone holding a copy still had a working session, and there was no way to
 * end it short of rotating JWT_SECRET and invalidating every session at once.
 *
 * So each token now carries a session id, and that id has to be present here for the token to be
 * accepted. Signing out removes it, which makes the token dead everywhere at once.
 *
 * Without Redis there is nowhere to keep the registry, and in that case tokens are accepted on
 * their signature alone, as before. That is the local development case, and `revocable()` reports
 * which of the two regimes is in force so the interface can say so rather than imply a guarantee
 * it does not have.
 */

const key = (sid: string) => `auth:session:${sid}`;

export function revocable(): boolean {
  return isRedisConfigured();
}

export async function registerSession(sid: string, ttlSeconds: number): Promise<void> {
  if (!isRedisConfigured()) return;
  await getRedis().set(key(sid), Date.now(), { ex: ttlSeconds });
}

/**
 * Whether a session id is still active.
 *
 * Fails open on a Redis error, deliberately. The alternative is that an outage signs you out of
 * your own site and the password will not let you back in; the token has already been proven
 * signed and unexpired by this point, so accepting it is a narrow concession.
 */
export async function isSessionActive(sid: string): Promise<boolean> {
  if (!isRedisConfigured()) return true;
  try {
    return (await getRedis().exists(key(sid))) === 1;
  } catch (e) {
    console.error("[auth-sessions] Redis unavailable, accepting a signed token:", e);
    return true;
  }
}

export async function revokeSession(sid: string): Promise<void> {
  if (!isRedisConfigured()) return;
  try {
    await getRedis().del(key(sid));
  } catch (e) {
    console.error("[auth-sessions] could not revoke session:", e);
  }
}

/** Ends every session, for when a device is lost or a cookie is thought to have leaked. */
export async function revokeAllSessions(): Promise<number> {
  if (!isRedisConfigured()) return 0;
  try {
    const redis = getRedis();
    const keys = await redis.keys("auth:session:*");
    if (!keys.length) return 0;
    await redis.del(...keys);
    return keys.length;
  } catch (e) {
    console.error("[auth-sessions] could not revoke all sessions:", e);
    return 0;
  }
}
