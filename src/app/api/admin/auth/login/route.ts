import { NextResponse } from "next/server";
import {
  credentialsAreConfigured,
  verifyAdminPassword,
} from "@/lib/admin-credentials";
import { adminSessionCookieOptions, getAdminSessionSecret, signAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");

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
