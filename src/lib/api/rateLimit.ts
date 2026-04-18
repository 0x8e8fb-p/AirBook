const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export interface RateLimitOptions {
  limit: number;
  windowSec: number;
  key: string;
}

async function upstashIncr(
  key: string,
  windowSec: number,
): Promise<{ count: number; ttl: number } | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const pipeline = [
      ["INCR", key],
      ["EXPIRE", key, String(windowSec), "NX"],
      ["TTL", key],
    ];
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { result: number }[];
    const count = Number(body[0]?.result ?? 0);
    const ttl = Number(body[2]?.result ?? windowSec);
    return { count, ttl: ttl > 0 ? ttl : windowSec };
  } catch {
    return null;
  }
}

function memoryIncr(key: string, windowSec: number): { count: number; ttl: number } {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowSec * 1000;
    memoryBuckets.set(key, { count: 1, resetAt });
    return { count: 1, ttl: windowSec };
  }
  bucket.count += 1;
  return { count: bucket.count, ttl: Math.ceil((bucket.resetAt - now) / 1000) };
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { limit, windowSec, key } = opts;
  const redisResult = await upstashIncr(key, windowSec);
  const { count, ttl } = redisResult ?? memoryIncr(key, windowSec);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + ttl * 1000,
    limit,
  };
}

export function getClientIp(req: Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };
}
