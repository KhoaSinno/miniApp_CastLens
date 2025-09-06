const memory = new Map<string, { count: number; ts: number }>();

export async function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const item = memory.get(key) || { count: 0, ts: now };
  if (now - item.ts > windowMs) {
    item.count = 0;
    item.ts = now;
  }
  item.count += 1;
  memory.set(key, item);
  if (item.count > limit) {
    throw new Error("Rate limit exceeded");
  }
}
