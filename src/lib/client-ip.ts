/**
 * Get the client IP from request headers.
 * Tries platform-specific headers first, then standard proxy headers.
 * For x-forwarded-for, uses the first (leftmost) IP as the client.
 */
export function getClientIp(headers: Headers): string | null {
  // Cloudflare (when behind Cloudflare proxy)
  const cf = headers.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();

  // Vercel: not overwritten when you have a proxy in front of Vercel
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel?.trim()) {
    const first = vercel.split(",")[0]?.trim();
    if (first) return first;
  }

  // Common with nginx / many hosts
  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  // Standard: "client, proxy1, proxy2" — leftmost is client
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded?.trim()) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return null;
}
