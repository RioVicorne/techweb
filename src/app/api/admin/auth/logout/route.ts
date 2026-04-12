import { NextResponse } from "next/server";
import { adminSessionCookieOptions, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...adminSessionCookieOptions(),
    maxAge: 0,
  });
  return res;
}
