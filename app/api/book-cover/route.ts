import { NextRequest, NextResponse } from "next/server";
import { normalizeIsbnDigits } from "@/lib/book-cover";

export const runtime = "nodejs";

const OL_UA =
  "Portfolio/1.0 (personal site; book cover preview - contact via site if issues)";

const CACHE_CONTROL = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

/** A book cover is a few hundred KB. Anything past this is not a cover we want to hold in memory. */
const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 6000;

/**
 * This endpoint is public and it fetches on the caller's behalf, so the two things that matter are
 * where it can be pointed and how much it will hold. The ISBN is digits-only and the host is
 * hardcoded, but Open Library answers with a redirect to archive.org, so the final destination is
 * decided by a third party. These are the hosts that chain is allowed to end on.
 */
const ALLOWED_HOSTS = new Set([
  "covers.openlibrary.org",
  "openlibrary.org",
  "archive.org",
  "ia600000.us.archive.org",
]);

function hostAllowed(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl);
    return ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".archive.org");
  } catch {
    return false;
  }
}

async function resolveCoverUrl(digits: string): Promise<string | null> {
  try {
    const editionRes = await fetch(`https://openlibrary.org/isbn/${digits}.json`, {
      headers: {
        Accept: "application/json",
        "User-Agent": OL_UA,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (editionRes.ok) {
      const data = (await editionRes.json()) as { covers?: number[] };
      const coverId = data.covers?.[0];
      if (typeof coverId === "number") {
        return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      }
    }
  } catch {
    // fall through to ISBN-based cover URL
  }

  return `https://covers.openlibrary.org/b/isbn/${digits}-L.jpg`;
}

/**
 * Resolves an Open Library cover for an ISBN and proxies the image bytes.
 * Open Library redirects to archive.org; proxying keeps img-src CSP tight.
 */
export async function GET(request: NextRequest) {
  const digits = normalizeIsbnDigits(request.nextUrl.searchParams.get("isbn") ?? "");
  if (!digits) {
    return NextResponse.json({ error: "Invalid or missing ISBN (need 10 or 13 digits)." }, { status: 400 });
  }

  const coverUrl = await resolveCoverUrl(digits);
  if (!coverUrl) {
    return NextResponse.json({ error: "Cover not found." }, { status: 404 });
  }

  try {
    const imageRes = await fetch(coverUrl, {
      headers: { "User-Agent": OL_UA },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!imageRes.ok) {
      return NextResponse.json({ error: "Cover image unavailable." }, { status: 502 });
    }

    if (!hostAllowed(imageRes.url)) {
      console.warn("[book-cover] redirect chain left the allowed hosts:", imageRes.url);
      return NextResponse.json({ error: "Invalid cover response." }, { status: 502 });
    }

    const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid cover response." }, { status: 502 });
    }

    const declared = Number(imageRes.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) {
      return NextResponse.json({ error: "Cover image too large." }, { status: 502 });
    }

    const bytes = await imageRes.arrayBuffer();
    // Content-Length is a claim; this is the measurement.
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Cover image too large." }, { status: 502 });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (err) {
    console.error("[book-cover]", err);
    return NextResponse.json({ error: "Failed to fetch cover image." }, { status: 502 });
  }
}
