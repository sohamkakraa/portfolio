import { NextRequest, NextResponse } from "next/server";
import { normalizeIsbnDigits } from "@/lib/book-cover";

const OL_UA =
  "Portfolio/1.0 (personal site; book cover preview — contact via site if issues)";

/**
 * Resolves an Open Library cover image URL for an ISBN.
 * Uses the edition API first (cover id is more reliable than the direct ISBN cover path).
 * Redirects the client to covers.openlibrary.org (works as <img src="/api/book-cover?...">).
 */
export async function GET(request: NextRequest) {
  const digits = normalizeIsbnDigits(request.nextUrl.searchParams.get("isbn") ?? "");
  if (!digits) {
    return NextResponse.json({ error: "Invalid or missing ISBN (need 10 or 13 digits)." }, { status: 400 });
  }

  try {
    const editionRes = await fetch(`https://openlibrary.org/isbn/${digits}.json`, {
      headers: {
        Accept: "application/json",
        "User-Agent": OL_UA,
      },
      next: { revalidate: 86_400 },
    });
    if (editionRes.ok) {
      const data = (await editionRes.json()) as { covers?: number[] };
      const coverId = data.covers?.[0];
      if (typeof coverId === "number") {
        return NextResponse.redirect(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`, 302);
      }
    }
  } catch {
    // fall through to ISBN-based cover URL
  }

  return NextResponse.redirect(`https://covers.openlibrary.org/b/isbn/${digits}-L.jpg`, 302);
}
