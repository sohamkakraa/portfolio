import { NextResponse } from "next/server";
import type { PortfolioData } from "@/lib/portfolio-types";
import { verifyAdminSession } from "@/lib/auth";
import { applyPatch, validatePortfolioData, type AIPatchOperation } from "@/lib/ai-portfolio";

export async function POST(request: Request) {
  const session = await verifyAdminSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csrf = request.headers.get("x-csrf-token");
  if (!csrf || csrf !== session.csrfToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { operations: AIPatchOperation[]; currentData: PortfolioData };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { operations, currentData } = body;
  if (!Array.isArray(operations) || !currentData) {
    return NextResponse.json({ error: "Missing operations or currentData" }, { status: 400 });
  }

  const updatedData = applyPatch(currentData, operations);
  if (!validatePortfolioData(updatedData)) {
    return NextResponse.json({ error: "Patch produced invalid data" }, { status: 422 });
  }

  return NextResponse.json({ updatedData, summary: "Confirmed and applied." });
}
