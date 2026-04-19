import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  nextJson: vi.fn((body: unknown, init?: ResponseInit) => ({
    body,
    status: init?.status ?? 200,
    headers: init?.headers,
    cookies: { set: vi.fn() },
  })),
  checkRateLimit: vi.fn(),
  getRequestIp: vi.fn(),
  credentialsAreConfigured: vi.fn(),
  verifyAdminPassword: vi.fn(),
  getAdminSessionSecret: vi.fn(),
  signAdminSession: vi.fn(),
  adminSessionCookieOptions: vi.fn(() => ({ httpOnly: true })),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: mocks.nextJson,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getRequestIp: mocks.getRequestIp,
}));

vi.mock("@/lib/admin-credentials", () => ({
  credentialsAreConfigured: mocks.credentialsAreConfigured,
  verifyAdminPassword: mocks.verifyAdminPassword,
}));

vi.mock("@/lib/admin-session", () => ({
  ADMIN_SESSION_COOKIE: "admin_session",
  getAdminSessionSecret: mocks.getAdminSessionSecret,
  signAdminSession: mocks.signAdminSession,
  adminSessionCookieOptions: mocks.adminSessionCookieOptions,
}));

import { POST } from "./route";

describe("POST /api/admin/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getRequestIp.mockReturnValue("127.0.0.1");
    mocks.checkRateLimit.mockResolvedValue({
      ok: true,
      remaining: 7,
      resetAt: Date.now() + 60_000,
      retryAfterSec: 60,
    });
    mocks.credentialsAreConfigured.mockReturnValue(true);
    mocks.getAdminSessionSecret.mockReturnValue("secret");
    mocks.verifyAdminPassword.mockReturnValue(true);
    mocks.signAdminSession.mockResolvedValue("signed-token");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
      retryAfterSec: 60,
    });

    const req = new Request("http://localhost/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@example.com", password: "wrong" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "Too many login attempts. Please try again later." });
    expect(res.headers).toMatchObject({
      "Retry-After": "60",
      "X-RateLimit-Remaining": "0",
    });
    expect(mocks.signAdminSession).not.toHaveBeenCalled();
  });

  it("sets admin session cookie on successful login", async () => {
    const req = new Request("http://localhost/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@example.com", password: "correct" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req) as {
      cookies: { set: ReturnType<typeof vi.fn> };
      status: number;
      body: unknown;
    };

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mocks.signAdminSession).toHaveBeenCalledWith("admin@example.com", "secret");
    expect(res.cookies.set).toHaveBeenCalledWith("admin_session", "signed-token", { httpOnly: true });
  });
});
