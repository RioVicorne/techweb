import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";

/**
 * Bảo vệ toàn bộ /admin (trừ /admin/login): cần cookie phiên admin hợp lệ.
 * API /api/admin/* vẫn được kiểm tra lại trong từng route (requireAdmin).
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login" || path.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("returnTo", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("returnTo", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  const verified = await verifyAdminSessionToken(token, secret);
  if (!verified) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("returnTo", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
