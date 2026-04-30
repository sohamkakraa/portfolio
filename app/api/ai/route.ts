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
  const rateKey = `ai:${ip}`;
  const { allowed, retryAfterMs } = checkAIRateLimit(rateKey);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterMs },
      { status: 429 }
    );
  }

  let body: { message: string; currentData: PortfolioData };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, currentData } = body;
  if (!message || typeof message !== "string" || !currentData) {
    return NextResponse.json({ error: "Missing message or currentData" }, { status: 400 });
  }

  let aiResponse: AIResponse;
  try {
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: buildSystemPrompt(currentData),
      messages: [{ role: "user", content: message }],
    });

    const text = completion.content.find((b) => b.type === "text")?.text ?? "";
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    aiResponse = JSON.parse(cleaned) as AIResponse;
  } catch (err) {
    console.error("[ai] anthropic/parse error", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  if (!Array.isArray(aiResponse.operations)) {
    return NextResponse.json({ error: "Invalid AI response shape" }, { status: 502 });
  }

  // When confirm is required, return without applying
  if (aiResponse.confirmRequired) {
    return NextResponse.json({
      updatedData: null,
      summary: aiResponse.summary,
      confirmRequired: true,
      confirmMessage: aiResponse.confirmMessage ?? "",
      operations: aiResponse.operations,
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
  });
}
