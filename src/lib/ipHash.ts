import { createHash } from "node:crypto";

/** SHA-256 hash of the IP — we never store raw IPs. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/** Extract client IP from a Next.js Request (handles proxies). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0] : "unknown").trim();
}
