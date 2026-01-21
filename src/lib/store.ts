// Hybrid store: Upstash Redis if configured, else in-memory

type StoreValue = { value: unknown; exp: number };

const mem = new Map<string, StoreValue>();

function now() { return Date.now(); }

// In-memory fallback
async function memGet(key: string) {
  const v = mem.get(key);
  if (!v) return null;
  if (v.exp < now()) { mem.delete(key); return null; }
  return v.value;
}

async function memSet(key: string, value: unknown, ttlMs: number) {
  mem.set(key, { value, exp: now() + ttlMs });
}

async function memDel(key: string) { mem.delete(key); }

// Upstash Redis
const hasUpstash = () =>
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstashFetch(cmd: string, ...args: (string | number)[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/${cmd}/${args.map(a => encodeURIComponent(String(a))).join("/")}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return res.json();
}

async function upstashGet(key: string) {
  const { result } = await upstashFetch("GET", key);
  if (!result) return null;
  try { return JSON.parse(result); } catch { return result; }
}

async function upstashSet(key: string, value: unknown, ttlMs: number) {
  const ttlSec = Math.ceil(ttlMs / 1000);
  await upstashFetch("SET", key, JSON.stringify(value), "EX", ttlSec);
}

async function upstashDel(key: string) {
  await upstashFetch("DEL", key);
}

// Exported unified API
export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  if (hasUpstash()) return upstashGet(key) as Promise<T | null>;
  return memGet(key) as Promise<T | null>;
}

export async function kvSet(key: string, value: unknown, ttlMs: number): Promise<void> {
  if (hasUpstash()) return upstashSet(key, value, ttlMs);
  return memSet(key, value, ttlMs);
}

export async function kvDel(key: string): Promise<void> {
  if (hasUpstash()) return upstashDel(key);
  return memDel(key);
}

// OTP record type
export interface OTPRecord {
  hashedCode: string;
  phone: string;
  modelId: string;
  issueId: string;
  expiresAt: number;
  attempts: number;
  lockedUntil: number | null;
  lastSentAt: number;
}

// Rate limit record type
export interface RateLimitRecord {
  count: number;
  resetAt: number;
}
