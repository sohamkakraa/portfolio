import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { PortfolioData } from "@/lib/portfolio-types";
import { verifyAdminSession } from "@/lib/auth";
import {
  checkAIRateLimit,
  buildSystemPrompt,
  applyPatch,
  validatePortfolioData,
  type AIResponse,
} from "@/lib/ai-portfolio";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type HistoryMessage = { role: "user" | "assistant"; content: string };

// How many recent messages to keep verbatim; older ones get compressed.
const KEEP_RECENT = 4;
const COMPRESS_AFTER = 6;

/**
 * Caveman "full" mode compression — drops articles, uses fragments and arrows,
 * preserves field names / values / decisions. Returns ≤120-word bullet list.
 */
async function compressToContext(
  messages: HistoryMessage[],
  existing: string
): Promise<string> {
  const lines = messages
    .map((m) => `${m.role === "user" ? "U" : "A"}: ${m.content}`)
    .join("\n");

  const existingBlock = existing
    ? `Existing compressed context:\n${existing}\n\nNew messages to merge in:\n`
    : "";

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content:
          `Compress conversation into brief context notes.\n` +
          `Rules: drop articles (a/an/the); fragments ok; use → for relationships; short synonyms.\n` +
          `Preserve exactly: portfolio field names, data values, decisions made, technical terms.\n` +
          `Format: bullet list, each line = topic→action/result. Max 120 words. No intro/outro.\n\n` +
          `${existingBlock}${lines}`,
      },
    ],
  });

  return res.content.find((b) => b.type === "text")?.text?.trim() ?? existing;
}

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

  let body: {
    message: string;
    currentData: PortfolioData;
    history?: HistoryMessage[];
    contextSummary?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, currentData, history = [], contextSummary = "" } = body;
  if (!message || typeof message !== "string" || !currentData) {
    return NextResponse.json({ error: "Missing message or currentData" }, { status: 400 });
  }

  // ── Context compression ───────────────────────────────────────────────────
  let activeContext = contextSummary;
  let newContextSummary: string | null = null;
  let recentHistory = history;

  if (history.length > COMPRESS_AFTER) {
    const toCompress = history.slice(0, -KEEP_RECENT);
    recentHistory = history.slice(-KEEP_RECENT);
    activeContext = await compressToContext(toCompress, contextSummary);
    newContextSummary = activeContext;
  }

  // Strip large image arrays — the AI edits CMS text, not photo URLs.
  // This reduces the system prompt from ~41KB to ~8KB.
  const dataForAI = {
    ...currentData,
    photography: {
      ...currentData.photography,
      categories: currentData.photography.categories.map((c) => ({
        slug: c.slug,
        title: c.title,
        description: c.description,
        accent: c.accent,
        hidden: c.hidden,
        images: [] as typeof c.images,
      })),
    },
  };

  // ── Build system prompt ───────────────────────────────────────────────────
  let systemPrompt = buildSystemPrompt(dataForAI);
  if (activeContext) {
    systemPrompt +=
      `\n\n## Prior conversation context (caveman-compressed)\n` +
      `Use this to understand what was already discussed:\n${activeContext}`;
  }

  // Ensure messages start with a user role (Claude requirement)
  const safeHistory = recentHistory[0]?.role === "assistant"
    ? recentHistory.slice(1)
    : recentHistory;

  // Wrap message to reinforce JSON-only output (guards against conversational drift)
  const wrappedMessage =
    `${message}\n\nRemember: respond ONLY with the JSON object — no prose, no markdown fences.`;

  const claudeMessages: Anthropic.MessageParam[] = [
    ...safeHistory.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: wrappedMessage },
  ];

  // ── Claude call ───────────────────────────────────────────────────────────
  let aiResponse: AIResponse;
  try {
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const raw = completion.content.find((b) => b.type === "text")?.text ?? "";
    // Strip markdown fences if present, then extract first JSON object
    const stripped = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const jsonStart = stripped.indexOf("{");
    const jsonEnd = stripped.lastIndexOf("}");
    const text = jsonStart !== -1 && jsonEnd !== -1 ? stripped.slice(jsonStart, jsonEnd + 1) : stripped;
    const cleaned = text.trim();
    aiResponse = JSON.parse(cleaned) as AIResponse;
  } catch (err) {
    console.error("[ai] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  if (!Array.isArray(aiResponse.operations)) {
    return NextResponse.json({ error: "Invalid AI response shape" }, { status: 502 });
  }

  if (aiResponse.confirmRequired) {
    return NextResponse.json({
      updatedData: null,
      summary: aiResponse.summary,
      confirmRequired: true,
      confirmMessage: aiResponse.confirmMessage ?? "",
      operations: aiResponse.operations,
      newContextSummary,
    });
  }

  const updatedData = applyPatch(currentData, aiResponse.operations);
  if (!validatePortfolioData(updatedData)) {
    return NextResponse.json({ error: "Patch produced invalid data" }, { status: 422 });
  }

  return NextResponse.json({
    updatedData,
    summary: aiResponse.summary,
    confirmRequired: false,
    confirmMessage: "",
    operations: aiResponse.operations,
    newContextSummary,
  });
}
