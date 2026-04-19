type Bucket = {
  count: number;
  resetAt: number;
};

type CheckResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

const BUCKETS = new Map<string, Bucket>();

function nowMs() {
  return Date.now();
}

function gcExpired(now: number) {
  for (const [key, bucket] of BUCKETS) {
    if (bucket.resetAt <= now) BUCKETS.delete(key);
  }
}

export function getRequestIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);

  if (first) return first;

  const xRealIp = req.headers.get("x-real-ip")?.trim();
  if (xRealIp) return xRealIp;

  return "unknown";
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): CheckResult {
  const now = nowMs();
  gcExpired(now);

  const bucket = BUCKETS.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    BUCKETS.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: Math.max(0, maxRequests - 1),
      resetAt,
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  if (bucket.count >= maxRequests) {
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  BUCKETS.set(key, bucket);

  return {
    ok: true,
    remaining: Math.max(0, maxRequests - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}
