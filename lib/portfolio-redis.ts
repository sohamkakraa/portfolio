import type { PortfolioData } from "@/lib/portfolio-types";
import { getRedis, isRedisConfigured } from "@/lib/redis";

const KEY = "portfolio:cms-v2";

export const isPortfolioRedisConfigured = isRedisConfigured;

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
