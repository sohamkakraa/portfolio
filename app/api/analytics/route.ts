import { NextResponse } from "next/server";
import { LIMITS, parseBatch } from "@/lib/analytics/schema";
import { dayKey, hasAnalyticsSalt, overBatchLimit, recordBatch, visitorHash } from "@/lib/analytics/store";
import { isRedisConfigured } from "@/lib/redis";

/**
 * Measurement ingest.
 *
 * This has to be public — a visitor has no session and never will — so the defences are the shape
 * of the request rather than who is asking: a hard body cap read before parsing, a strict schema
 * that drops anything unrecognised, and a per-visitor batch ceiling. It answers 204 in every
 * non-abusive case, including when Redis is not configured, because a measurement endpoint must
 * never be a source of errors in a visitor's console.
 */

const NO_CONTENT = new NextResponse(null, { status: 204 });

/**
 * As in the auth route: Vercel overwrites x-forwarded-for at the edge, so it is not client
 * controlled there. This value is salted and hashed before it is used and is never stored raw.
 */
function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  // Do not spend a Redis round trip when there is nowhere to write.
  if (!isRedisConfigured() || !hasAnalyticsSalt()) return NO_CONTENT;

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > LIMITS.bodyBytes) {
    return NextResponse.json({ error: "Batch too large." }, { status: 413 });
  }

  const raw = await request.text();
  if (raw.length > LIMITS.bodyBytes) {
    return NextResponse.json({ error: "Batch too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed batch." }, { status: 400 });
  }

  const batch = parseBatch(body);
  if (!batch) return NextResponse.json({ error: "Malformed batch." }, { status: 400 });

  const day = dayKey();
  const visitor = visitorHash(clientIp(request), request.headers.get("user-agent") ?? "", day);
  if (await overBatchLimit(visitor)) {
    return NextResponse.json({ error: "Too many batches." }, { status: 429 });
  }

  try {
    await recordBatch(batch, {
      visitor,
      // Supplied by the platform, so it costs nothing and is coarser than an IP.
      country: request.headers.get("x-vercel-ip-country") ?? undefined,
      day,
    });
  } catch (e) {
    // A measurement failure is not a visitor's problem. Log it and answer normally.
    console.error("[analytics] write failed:", e);
  }

  return NO_CONTENT;
}
