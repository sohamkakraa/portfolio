import { NextResponse } from "next/server";
import { LIMITS, addGuess, cleanText, communityReady, isQuestion, overLimit } from "@/lib/basecamp/community";
import { clientIp, readJson } from "@/lib/basecamp/request";

/**
 * A visitor's guess at one of the open questions. It is stored as pending and only appears on the
 * site after it is approved in /admin/community.
 */
export async function POST(request: Request) {
  if (!communityReady()) {
    return NextResponse.json({ error: "Guesses are not open yet. Try again later." }, { status: 503 });
  }
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: "That didn't come through. Try again." }, { status: 400 });

  // The hidden "website" field is left empty by people and filled in by bots. Pretend it worked.
  if (cleanText(body.website, 200)) return NextResponse.json({ ok: true }, { status: 202 });

  if (!isQuestion(body.questionId)) {
    return NextResponse.json({ error: "That question doesn't exist any more." }, { status: 400 });
  }
  const text = cleanText(body.text, LIMITS.text);
  if (text.length < 3) {
    return NextResponse.json({ error: "Write a little more before sending." }, { status: 400 });
  }
  const name = cleanText(body.name, LIMITS.name);

  if (await overLimit(clientIp(request), request.headers.get("user-agent") ?? "")) {
    return NextResponse.json({ error: "That's a lot of guesses. Try again in an hour." }, { status: 429 });
  }

  await addGuess(body.questionId, text, name);
  return NextResponse.json({ ok: true }, { status: 202 });
}
