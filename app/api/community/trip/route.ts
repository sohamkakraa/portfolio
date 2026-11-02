import { NextResponse } from "next/server";
import { addSignup, cleanEmail, cleanText, communityReady, isPlace, overLimit } from "@/lib/basecamp/community";
import { clientIp, readJson } from "@/lib/basecamp/request";

/**
 * "I might come along" for a place on the wishlist. The email is only used to write about that trip
 * and is never shown on the site.
 */
export async function POST(request: Request) {
  if (!communityReady()) {
    return NextResponse.json({ error: "Signups are not open yet. Try again later." }, { status: 503 });
  }
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: "That didn't come through. Try again." }, { status: 400 });

  if (cleanText(body.website, 200)) return NextResponse.json({ ok: true }, { status: 202 });

  if (!isPlace(body.placeId)) {
    return NextResponse.json({ error: "That trip isn't on the list any more." }, { status: 400 });
  }
  const email = cleanEmail(body.email);
  if (!email) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  if (body.consent !== true) {
    return NextResponse.json({ error: "Tick the box so I'm allowed to email you." }, { status: 400 });
  }

  if (await overLimit(clientIp(request), request.headers.get("user-agent") ?? "")) {
    return NextResponse.json({ error: "Too many signups from here. Try again in an hour." }, { status: 429 });
  }

  await addSignup(body.placeId, email);
  return NextResponse.json({ ok: true }, { status: 202 });
}
