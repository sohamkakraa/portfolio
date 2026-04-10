import { Redis } from "@upstash/redis";
import type { PortfolioData } from "@/lib/portfolio-types";

const KEY = "portfolio:cms-v2";

export function isPortfolioRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

let client: Redis | null = null;

function getRedis(): Redis {
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

export async function readPortfolioFromRedis(): Promise<PortfolioData | null> {
  if (!isPortfolioRedisConfigured()) return null;
  try {
    const raw = await getRedis().get<string | PortfolioData>(KEY);
    if (raw == null) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as PortfolioData;
      } catch {
        return null;
      }
    }
    return raw as PortfolioData;
  } catch (e) {
    console.error("[portfolio-redis read]", e);
    return null;
  }
}

export async function writePortfolioToRedis(data: PortfolioData): Promise<void> {
  await getRedis().set(KEY, JSON.stringify(data));
}
