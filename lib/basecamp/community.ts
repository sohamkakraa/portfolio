import { createHash, randomUUID } from "node:crypto";
import { getRedis, isRedisConfigured } from "@/lib/redis";
import { ALL_PLACES, CURIOUS } from "@/lib/basecamp/lists";

/**
 * Guesses and trip signups.
 *
 * Keys, all under cm: so they never collide with the CMS or analytics:
 *   cm:g:{id}            HASH  one guess: q, text, name, at, status
 *   cm:g:pending         ZSET  guess ids waiting for review, scored by time
 *   cm:g:q:{questionId}  ZSET  approved guess ids for one question
 *   cm:t:{placeId}       HASH  email -> signup time, for one wishlist place
 *   cm:rl:{who}          STR   submissions in the current hour, for rate limiting
 *
 * A guess waits at most 90 days for review before it expires on its own. Approved guesses stay
 * until removed. Trip signups expire 24 months after the latest one for that place.
 */

const PENDING_TTL = 90 * 24 * 60 * 60;
const SIGNUP_TTL = 730 * 24 * 60 * 60;
const HOURLY_LIMIT = 8;

export const LIMITS = { text: 600, name: 40, email: 254 } as const;

export type Guess = {
  id: string;
  questionId: string;
  text: string;
  name: string;
  at: number;
  status: "pending" | "approved";
};

export type Signup = { placeId: string; email: string; at: number };

export const communityReady = isRedisConfigured;

const QUESTION_IDS = new Set(CURIOUS.map((q) => q.id));
const PLACE_IDS = new Set(ALL_PLACES.map((p) => p.id));

export const isQuestion = (id: unknown): id is string => typeof id === "string" && QUESTION_IDS.has(id);
export const isPlace = (id: unknown): id is string => typeof id === "string" && PLACE_IDS.has(id);

/** Collapses whitespace and strips control characters. Text is always rendered as text, never HTML. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= LIMITS.email && EMAIL.test(email) ? email : null;
}

/**
 * True when this sender is over the hourly limit. The IP is hashed with a server secret and the
 * key expires within the hour, so no raw address is ever written.
 */
export async function overLimit(ip: string, ua: string): Promise<boolean> {
  const secret = process.env.ANALYTICS_SALT?.trim() || process.env.JWT_SECRET || "";
  const who = createHash("sha256").update(`${secret}:cm:${ip}:${ua}`).digest("hex").slice(0, 24);
  const key = `cm:rl:${who}`;
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  return count > HOURLY_LIMIT;
}

export async function addGuess(questionId: string, text: string, name: string): Promise<void> {
  const id = randomUUID();
  const at = Date.now();
  const p = getRedis().pipeline();
  p.hset(`cm:g:${id}`, { q: questionId, text, name, at, status: "pending" });
  p.expire(`cm:g:${id}`, PENDING_TTL);
  p.zadd("cm:g:pending", { score: at, member: id });
  await p.exec();
}

export async function addSignup(placeId: string, email: string): Promise<void> {
  const key = `cm:t:${placeId}`;
  const p = getRedis().pipeline();
  p.hset(key, { [email]: Date.now() });
  p.expire(key, SIGNUP_TTL);
  await p.exec();
}

function toGuess(id: string, raw: Record<string, unknown> | null): Guess | null {
  if (!raw || typeof raw.q !== "string") return null;
  return {
    id,
    questionId: raw.q,
    text: String(raw.text ?? ""),
    name: String(raw.name ?? ""),
    at: Number(raw.at ?? 0),
    status: raw.status === "approved" ? "approved" : "pending",
  };
}

async function loadGuesses(ids: string[]): Promise<Guess[]> {
  if (!ids.length) return [];
  const p = getRedis().pipeline();
  for (const id of ids) p.hgetall(`cm:g:${id}`);
  const rows = (await p.exec()) as (Record<string, unknown> | null)[];
  return ids.map((id, i) => toGuess(id, rows[i])).filter((g): g is Guess => g !== null);
}

export async function pendingGuesses(): Promise<Guess[]> {
  const ids = (await getRedis().zrange("cm:g:pending", 0, -1, { rev: true })) as string[];
  const guesses = await loadGuesses(ids);
  // Ids whose hash expired unreviewed are dropped from the queue as they are found.
  const alive = new Set(guesses.map((g) => g.id));
  const dead = ids.filter((id) => !alive.has(id));
  if (dead.length) await getRedis().zrem("cm:g:pending", ...dead);
  return guesses;
}

/** Approved guesses for every question, oldest first, for the public page. */
export async function approvedByQuestion(): Promise<Record<string, Guess[]>> {
  if (!isRedisConfigured()) return {};
  const questions = CURIOUS.map((q) => q.id);
  const p = getRedis().pipeline();
  for (const q of questions) p.zrange(`cm:g:q:${q}`, 0, 49);
  const idLists = (await p.exec()) as string[][];
  const all = await loadGuesses(idLists.flat());
  const byId = new Map(all.map((g) => [g.id, g]));
  return Object.fromEntries(
    questions.map((q, i) => [q, idLists[i].map((id) => byId.get(id)).filter((g): g is Guess => !!g)])
  );
}

export async function approveGuess(id: string): Promise<void> {
  const [guess] = await loadGuesses([id]);
  if (!guess) return;
  const p = getRedis().pipeline();
  p.hset(`cm:g:${id}`, { status: "approved" });
  p.persist(`cm:g:${id}`);
  p.zrem("cm:g:pending", id);
  p.zadd(`cm:g:q:${guess.questionId}`, { score: guess.at, member: id });
  await p.exec();
}

export async function deleteGuess(id: string): Promise<void> {
  const [guess] = await loadGuesses([id]);
  const p = getRedis().pipeline();
  p.del(`cm:g:${id}`);
  p.zrem("cm:g:pending", id);
  if (guess) p.zrem(`cm:g:q:${guess.questionId}`, id);
  await p.exec();
}

export async function approvedGuesses(): Promise<Guess[]> {
  const groups = await approvedByQuestion();
  return Object.values(groups).flat().sort((a, b) => b.at - a.at);
}

export async function allSignups(): Promise<Signup[]> {
  const ids = ALL_PLACES.map((p) => p.id);
  const p = getRedis().pipeline();
  for (const id of ids) p.hgetall(`cm:t:${id}`);
  const rows = (await p.exec()) as (Record<string, unknown> | null)[];
  return ids.flatMap((placeId, i) =>
    Object.entries(rows[i] ?? {}).map(([email, at]) => ({ placeId, email, at: Number(at) }))
  );
}

export async function deleteSignup(placeId: string, email: string): Promise<void> {
  await getRedis().hdel(`cm:t:${placeId}`, email);
}
