import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { PhotoMeta } from "@/lib/portfolio-types";
import { verifyAdminSession } from "@/lib/auth";
import { checkAIRateLimit } from "@/lib/ai-portfolio";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB before base64

export async function POST(request: Request) {
  const session = await verifyAdminSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csrf = request.headers.get("x-csrf-token");
  if (!csrf || csrf !== session.csrfToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterMs } = checkAIRateLimit(`ai:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", retryAfterMs }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const metaRaw = formData.get("meta") as string | null;
  const category = (formData.get("category") as string | null) ?? "";

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  let existingMeta: PhotoMeta = {};
  try {
    existingMeta = metaRaw ? (JSON.parse(metaRaw) as PhotoMeta) : {};
  } catch {
    existingMeta = {};
  }

  // Resize to a sensible byte budget: if too large, skip vision (don't error)
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return NextResponse.json({
      title: "",
      description: "",
      location: existingMeta.location ?? "",
      skipped: true,
    });
  }

  const b64 = Buffer.from(bytes).toString("base64");
  const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const knownFields = Object.entries(existingMeta)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const prompt = `You are a photography metadata assistant. Look at this photo carefully.

Known technical metadata: ${knownFields || "none"}.
Photography category: ${category || "unknown"}.

Return ONLY valid JSON with exactly these keys — no markdown, no commentary:
{
  "title": "A short evocative title (3-7 words) for this specific photo",
  "description": "One sentence description of what the photo shows, mood, and key elements (20-40 words)",
  "location": "Best guess at location shown in photo (city, country) — empty string if you cannot tell"
}

Rules:
- title: specific to this image, not generic; no quotes around proper nouns
- description: vivid and specific, present tense
- location: only if the scene provides clear visual location clues AND no GPS location was already extracted; if GPS location is known (${existingMeta.location ? `"${existingMeta.location}"` : "not available"}), return that exact value unchanged`;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: b64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const text = completion.content.find((b) => b.type === "text")?.text ?? "{}";
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned) as { title?: string; description?: string; location?: string };

    return NextResponse.json({
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      location: parsed.location ?? existingMeta.location ?? "",
    });
  } catch (err) {
    console.error("[photo-analyze] error", err);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 502 });
  }
}
