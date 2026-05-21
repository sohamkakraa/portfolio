import { NextRequest, NextResponse } from "next/server";
import { normalizeIsbnDigits } from "@/lib/book-cover";

export const runtime = "nodejs";

const OL_UA =
  "Portfolio/1.0 (personal site; book cover preview - contact via site if issues)";

const CACHE_CONTROL = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

async function resolveCoverUrl(digits: string): Promise<string | null> {
  try {
    const editionRes = await fetch(`https://openlibrary.org/isbn/${digits}.json`, {
      headers: {
        Accept: "application/json",
        "User-Agent": OL_UA,
      },
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
    });

    if (!imageRes.ok) {
      return NextResponse.json({ error: "Cover image unavailable." }, { status: 502 });
    }

    const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid cover response." }, { status: 502 });
    }

    const bytes = await imageRes.arrayBuffer();
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
