import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
const REDIS_LIMITERS = new Map<string, Ratelimit>();
const REDIS_CLIENT = getRedisClient();

function nowMs() {
  return Date.now();
}

function gcExpired(now: number) {
  for (const [key, bucket] of BUCKETS) {
    if (bucket.resetAt <= now) BUCKETS.delete(key);
  }
}

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";

  if (!url || !token) return null;

  return new Redis({
    url,
    token,
  });
}

function getRedisLimiter(maxRequests: number, windowMs: number): Ratelimit | null {
  if (!REDIS_CLIENT) return null;

  const seconds = Math.max(1, Math.ceil(windowMs / 1000));
  const key = `${maxRequests}:${seconds}`;

  const existing = REDIS_LIMITERS.get(key);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: REDIS_CLIENT,
    limiter: Ratelimit.fixedWindow(maxRequests, `${seconds} s`),
    analytics: false,
    prefix: "ratelimit",
  });

  REDIS_LIMITERS.set(key, limiter);
  return limiter;
}

function checkRateLimitMemory(
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

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<CheckResult> {
  const limiter = getRedisLimiter(maxRequests, windowMs);

  if (!limiter) {
    return checkRateLimitMemory(key, maxRequests, windowMs);
  }

  try {
    const result = await limiter.limit(key);
    const now = nowMs();

    return {
      ok: result.success,
      remaining: Math.max(0, result.remaining),
      resetAt: result.reset,
      retryAfterSec: Math.max(1, Math.ceil((result.reset - now) / 1000)),
    };
  } catch {
    return checkRateLimitMemory(key, maxRequests, windowMs);
  }
}
