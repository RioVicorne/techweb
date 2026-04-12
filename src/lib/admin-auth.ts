import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminSessionSecret, verifyAdminSessionToken } from "@/lib/admin-session";

export type AdminAuthOk = { email: string };

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

/**
 * Xác thực phiên admin qua cookie HttpOnly (không dùng Bearer Supabase).
 */
export async function requireAdmin(
  req: Request,
): Promise<{ ok: true; auth: AdminAuthOk } | { ok: false; response: NextResponse }> {
  const secret = getAdminSessionSecret();
  if (!secret) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin session not configured" }, { status: 503 }),
    };
  }

  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[ADMIN_SESSION_COOKIE] ?? "";
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const verified = await verifyAdminSessionToken(token, secret);
  if (!verified) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true, auth: { email: verified.email } };
}
