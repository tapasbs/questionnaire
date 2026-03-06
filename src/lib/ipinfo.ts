/**
 * Get the visitor's public IP and country from the browser (client-side only).
 * Uses ipinfo.io — one request for both IP and country.
 */
export type IpInfo = {
  ip: string | null;
  country: string | null;
};

export async function getClientIpInfo(): Promise<IpInfo> {
  try {
    const res = await fetch("https://ipinfo.io/json");
    const data = (await res.json()) as {
      ip?: string;
      country?: string;
    };
    const ip = typeof data?.ip === "string" ? data.ip.trim() || null : null;
    const country = typeof data?.country === "string" ? data.country.trim() || null : null;
    return { ip, country };
  } catch {
    return { ip: null, country: null };
  }
}
