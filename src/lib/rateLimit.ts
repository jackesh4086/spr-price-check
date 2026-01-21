import { kvGet, kvSet } from "./store";

export async function enforceCooldown(key: string, cooldownMs: number) {
  const last = await kvGet<{ ts: number }>(key);
  const now = Date.now();
  if (last && typeof last.ts === "number" && (now - last.ts) < cooldownMs) {
    const waitMs = cooldownMs - (now - last.ts);
    return { ok: false, waitMs };
  }
  await kvSet(key, { ts: now }, cooldownMs);
  return { ok: true, waitMs: 0 };
}

export async function incrementWithTtl(key: string, ttlMs: number) {
  const v = await kvGet<{ count: number }>(key);
  const count = (v?.count ?? 0) + 1;
  await kvSet(key, { count }, ttlMs);
  return count;
}

export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
