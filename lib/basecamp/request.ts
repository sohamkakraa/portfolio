/**
 * Vercel overwrites x-forwarded-for at the edge, so it is not client controlled there. The value is
 * only ever hashed for rate limiting and never stored raw.
 */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Reads a small JSON body, refusing anything over the byte cap before parsing it. */
export async function readJson(request: Request, maxBytes = 4096): Promise<Record<string, unknown> | null> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return null;
  try {
    const raw = await request.text();
    if (raw.length > maxBytes) return null;
    const body = JSON.parse(raw);
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}
