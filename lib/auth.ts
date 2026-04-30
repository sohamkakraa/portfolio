import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "admin_session";
export const SESSION_DURATION_DAYS = 30;
export const SESSION_DURATION_SECONDS = SESSION_DURATION_DAYS * 24 * 60 * 60;

export interface SessionPayload {
  sub: string;
  csrfToken: string;
  iat: number;
  exp: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET env var is missing or too short (need ≥32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(csrfToken: string): Promise<string> {
  return new SignJWT({ sub: "admin", csrfToken })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (payload.sub !== "admin") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Parse the admin_session value from a raw Cookie header string. */
export async function verifyAdminSession(cookieHeader: string | null): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;
  const raw = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return null;
  try {
    return verifySessionToken(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function sessionCookieOptions(expires: Date) {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}

export function daysUntilExpiry(exp: number): number {
  return Math.max(0, Math.round((exp * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
}
