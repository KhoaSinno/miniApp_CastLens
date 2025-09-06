import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null;

export async function getCache(k: string) {
  return redis ? redis.get(k) : null;
}

export async function setCache(k: string, v: unknown, ttlSec = 86400) {
  if (redis) await redis.set(k, v, { ex: ttlSec });
}
