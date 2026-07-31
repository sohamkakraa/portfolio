import { Redis } from "@upstash/redis";

/**
 * One Redis client for the whole app.
 *
 * The CMS had its own client and its own configured-check. Auth now needs Redis too — for a rate
 * limit that survives a cold start and for sessions that can be revoked — and two modules each
 * holding their own singleton is how connection settings drift apart.
 */

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set.");
    }
    client = new Redis({ url, token });
  }
  return client;
}
