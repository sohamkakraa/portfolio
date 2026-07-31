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
import {
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/auth-rate-limit";

function getPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!hash) throw new Error("ADMIN_PASSWORD_HASH is not configured");
  return hash;
}

/**
 * The caller's address, as the platform reports it.
 *
 * Reading a client-settable header would normally be a poor thing to rate limit on, but Vercel
 * overwrites x-forwarded-for at the edge and does not forward externally supplied values, exactly
 * so it cannot be spoofed. Off Vercel that guarantee does not hold, so anything relying on this
 * key has to sit behind a proxy that sets the header itself.
 */
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
  const { allowed, retryAfterMs } = await checkLoginRateLimit(ip);

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
    await recordLoginFailure(ip);
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // A correct password wipes the slate, so a run of typos does not leave a lockout waiting.
  await clearLoginFailures(ip);

  const csrfToken = randomBytes(16).toString("hex");
  const sid = randomBytes(16).toString("hex");
  const token = await createSessionToken(csrfToken, sid);
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
