import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  nextJson: vi.fn((body: unknown, init?: ResponseInit) => ({
    body,
    status: init?.status ?? 200,
    headers: init?.headers,
  })),
  getRequestIp: vi.fn(),
  checkRateLimit: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  insertSingle: vi.fn(),
  insertSelect: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
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

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({
    from: mocks.from,
  }),
}));

import { POST } from "./route";

describe("POST /api/products/[productId]/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getRequestIp.mockReturnValue("127.0.0.1");
    mocks.checkRateLimit.mockResolvedValue({
      ok: true,
      remaining: 5,
      resetAt: Date.now() + 60_000,
      retryAfterSec: 60,
    });

    mocks.from.mockImplementation((table: string) => {
      if (table === "products") {
        return { select: mocks.select };
      }
      if (table === "product_reviews") {
        return { insert: mocks.insert };
      }
      return {};
    });

    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null });

    mocks.insert.mockReturnValue({ select: mocks.insertSelect });
    mocks.insertSelect.mockReturnValue({ single: mocks.insertSingle });
    mocks.insertSingle.mockResolvedValue({
      data: { id: 11, status: "PENDING" },
      error: null,
    });
  });

  function makeRequest() {
    return new Request("http://localhost/api/products/1/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rating: 5,
        title: "Great",
        comment: "Nice",
        reviewerName: "Tester",
        reviewerEmail: "t@example.com",
      }),
    });
  }

  it("returns 429 when review submit is rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
      retryAfterSec: 60,
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ productId: "1" }) });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "Too many review submissions. Please try again later." });
    expect(res.headers).toMatchObject({
      "Retry-After": "60",
      "X-RateLimit-Remaining": "0",
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("creates pending review on valid request", async () => {
    const res = await POST(makeRequest(), { params: Promise.resolve({ productId: "1" }) });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      review: { id: 11, status: "PENDING" },
      message: "Review submitted, pending approval",
    });
  });
});
