import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAdminSession } from "@/lib/auth";
import { revokeAllSessions, revokeSession } from "@/lib/auth-sessions";

/**
 * POST /api/auth/logout — end the session, not just the cookie
 *
 * Clearing the cookie only told this browser to forget the token. The token stayed valid for the
 * rest of its thirty days, so signing out did nothing at all for a copy that had leaked. Revoking
 * the session id first is what makes it stop working.
 *
 * POST /api/auth/logout?all=1 ends every session, for a lost device.
 */
export async function POST(request: Request) {
  const session = await verifyAdminSession(request.headers.get("cookie"));
  const all = new URL(request.url).searchParams.get("all") === "1";

  let revokedCount = 0;
  if (all) {
    // Requires a valid session: otherwise anyone passing by could sign you out of everything.
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    revokedCount = await revokeAllSessions();
  } else if (session?.sid) {
    await revokeSession(session.sid);
    revokedCount = 1;
  }

  // Always clear the cookie, even with no valid session to revoke — the point of pressing sign out
  // is to end up signed out.
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ ok: true, revoked: revokedCount });
}
