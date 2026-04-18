const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const memory = new Map<string, { expires: number; value: unknown }>();

const MEMORY_MAX_ENTRIES = 500;

function pruneMemory() {
  if (memory.size <= MEMORY_MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, v] of memory) {
    if (v.expires <= now) memory.delete(k);
    if (memory.size <= MEMORY_MAX_ENTRIES) break;
  }
  if (memory.size > MEMORY_MAX_ENTRIES) {
    const overflow = memory.size - MEMORY_MAX_ENTRIES;
    const it = memory.keys();
    for (let i = 0; i < overflow; i++) memory.delete(it.next().value!);
  }
}

async function upstashGet<T>(key: string): Promise<T | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { result: string | null };
  if (!body.result) return null;
  try {
    return JSON.parse(body.result) as T;
  } catch {
    return null;
  }
}

async function upstashSet<T>(key: string, value: T, ttlSec: number): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  const payload = JSON.stringify(value);
  await fetch(
    `${UPSTASH_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(payload)}?EX=${ttlSec}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: "no-store",
    },
  ).catch(() => undefined);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const hit = memory.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  if (hit) memory.delete(key);

  const remote = await upstashGet<T>(key);
  if (remote !== null) {
    memory.set(key, { expires: Date.now() + 30_000, value: remote });
    pruneMemory();
    return remote;
  }
  return null;
}

export async function cacheSet<T>(key: string, value: T, ttlSec: number): Promise<void> {
  memory.set(key, { expires: Date.now() + ttlSec * 1000, value });
  pruneMemory();
  await upstashSet(key, value, ttlSec);
}

export function cacheKey(parts: (string | number | boolean | undefined | null)[]): string {
  return parts.map((p) => (p === undefined || p === null ? "_" : String(p))).join(":");
}

export const CACHE_TTL = {
  fares: 120,
  calendar: 900,
  coupons: 300,
  airports: 86_400,
  airlines: 86_400,
  routes: 3_600,
  live: 10,
  health: 60,
} as const;
