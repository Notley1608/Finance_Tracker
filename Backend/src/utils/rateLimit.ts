import { HttpError } from "./index";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

function formatWindow(windowMs: number): string {
  const minutes = Math.round(windowMs / 60000);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function rateLimit(key: string, config: RateLimitConfig): Bucket {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    const fresh: Bucket = { count: 1, resetAt: now + config.windowMs };
    buckets.set(key, fresh);
    return fresh;
  }

  bucket.count += 1;
  if (bucket.count > config.max) {
    throw new HttpError(
      429,
      `Too many attempts. Please try again in ${formatWindow(config.windowMs)}.`,
    );
  }
  return bucket;
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

export function clientIp(
  headers: Record<string, string | undefined>,
): string {
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return headers["x-real-ip"] ?? "unknown";
}