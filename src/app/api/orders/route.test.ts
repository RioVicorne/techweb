import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  nextJson: vi.fn((body: unknown, init?: ResponseInit) => ({
    body,
    status: init?.status ?? 200,
    headers: init?.headers,
  })),
  getRequestIp: vi.fn(),
  checkRateLimit: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  in: vi.fn(),
  rpc: vi.fn(),
  createOrderId: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: mocks.nextJson,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  getRequestIp: mocks.getRequestIp,
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getSupabaseServerAuth: () => ({
    auth: {
      getUser: mocks.getUser,
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({
    from: mocks.from,
    rpc: mocks.rpc,
  }),
}));

vi.mock("@/lib/orders", () => ({
  createOrderId: mocks.createOrderId,
}));

import { POST } from "./route";

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getRequestIp.mockReturnValue("127.0.0.1");
    mocks.checkRateLimit.mockResolvedValue({
      ok: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
      retryAfterSec: 60,
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mocks.createOrderId.mockReturnValue("RS1234567890ABCD");

    mocks.from.mockImplementation(() => ({
      select: mocks.select,
    }));
    mocks.select.mockReturnValue({ in: mocks.in });
    mocks.in.mockResolvedValue({
      data: [{ id: 1, slug: "sku-1" }],
      error: null,
    });

    mocks.rpc.mockResolvedValue({
      data: "RS1234567890ABCD",
      error: null,
    });
  });

  function makeRequest() {
    return new Request("http://localhost/api/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token",
      },
      body: JSON.stringify({
        customer: {
          name: "A",
          phone: "0909",
          email: "a@example.com",
          address: "123",
        },
        lines: [
          {
            productId: "sku-1",
            title: "Product",
            priceDisplay: "100đ",
            priceVnd: 100,
            image: "",
            qty: 1,
          },
        ],
        subtotalVnd: 100,
        shippingVnd: 10,
        totalVnd: 110,
        paymentMethod: "COD",
      }),
    });
  }

  it("returns 401 when missing bearer token", async () => {
    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 429 when order creation is rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
      retryAfterSec: 60,
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "Too many order requests. Please try again later." });
    expect(res.headers).toMatchObject({
      "Retry-After": "60",
      "X-RateLimit-Remaining": "0",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("creates order via transactional rpc", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_order_with_items",
      expect.objectContaining({
        p_order_code: "RS1234567890ABCD",
        p_user_id: "user-1",
      }),
    );
    expect(res.body).toEqual({
      orderId: "RS1234567890ABCD",
      qrCodeUrl: null,
      moMoDeepLink: null,
    });
  });
});
