import { NextResponse } from "next/server";
import {
  credentialsAreConfigured,
  verifyAdminPassword,
} from "@/lib/admin-credentials";
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions, getAdminSessionSecret, signAdminSession } from "@/lib/admin-session";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const ADMIN_LOGIN_LIMIT = {
  maxRequests: 8,
  windowMs: 5 * 60 * 1000,
};

export async function POST(req: Request) {
  const ip = getRequestIp(req);

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    const limit = await checkRateLimit(
      `admin-login:${ip}:${email.toLowerCase()}`,
      ADMIN_LOGIN_LIMIT.maxRequests,
      ADMIN_LOGIN_LIMIT.windowMs,
    );

    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSec),
            "X-RateLimit-Remaining": String(limit.remaining),
          },
        },
      );
    }

    if (!credentialsAreConfigured()) {
      return NextResponse.json(
        { error: "Chưa cấu hình ADMIN_EMAIL và ADMIN_PASSWORD trên server." },
        { status: 503 },
      );
    }

    const secret = getAdminSessionSecret();
    if (!secret) {
      return NextResponse.json(
        { error: "Thiếu ADMIN_SESSION_SECRET (dùng để ký phiên đăng nhập)." },
        { status: 503 },
      );
    }

    if (!verifyAdminPassword(email, password)) {
      return NextResponse.json({ error: "Sai email hoặc mật khẩu." }, { status: 401 });
    }

    const token = await signAdminSession(email, secret);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
