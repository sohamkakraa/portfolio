import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import {
  createSessionToken,
  verifyAdminSession,
  sessionCookieOptions,
  daysUntilExpiry,
  SESSION_DURATION_DAYS,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth";
import { checkLoginRateLimit } from "@/lib/auth-rate-limit";

function getPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!hash) throw new Error("ADMIN_PASSWORD_HASH is not configured");
  return hash;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** POST /api/auth — verify password, issue signed session cookie */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkLoginRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let password: string;
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== "string" || !body.password) {
      return NextResponse.json({ error: "Password required." }, { status: 400 });
    }
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let hash: string;
  try {
    hash = getPasswordHash();
  } catch {
    return NextResponse.json(
      { error: "Auth is not configured on this server. Set ADMIN_PASSWORD_HASH." },
      { status: 500 }
    );
  }

  const valid = bcrypt.compareSync(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const csrfToken = randomBytes(16).toString("hex");
  const token = await createSessionToken(csrfToken);
  const expires = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  const cookieStore = await cookies();
  cookieStore.set({ ...sessionCookieOptions(expires), value: token });

  return NextResponse.json({
    ok: true,
    csrfToken,
    expiresAt: expires.toISOString(),
    expiresInDays: SESSION_DURATION_DAYS,
  });
}

/** GET /api/auth — verify existing session and return CSRF token for client */
export async function GET(request: Request) {
  const session = await verifyAdminSession(request.headers.get("cookie"));

  if (!session) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    csrfToken: session.csrfToken,
    expiresAt: new Date(session.exp * 1000).toISOString(),
    expiresInDays: daysUntilExpiry(session.exp),
  });
}
