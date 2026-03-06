import { UAParser } from "ua-parser-js";

export type DeviceInfo = {
  deviceType: string | null;
  os: string | null;
  browser: string | null;
};

/**
 * Parse User-Agent header to get device type, OS, and browser.
 * Use on the server with request.headers.get("user-agent").
 */
export function parseUserAgent(userAgent: string | null): DeviceInfo {
  const ua = userAgent ?? "";
  const parser = new UAParser(ua);
  const result = parser.getResult();

  const rawDevice = result.device?.type as string | undefined;
  const deviceType =
    rawDevice && rawDevice !== "undefined" ? rawDevice : "desktop";
  const rawOs = result.os?.name as string | undefined;
  const os = rawOs && rawOs !== "undefined" ? rawOs : null;
  const rawBrowser = result.browser?.name as string | undefined;
  const browser =
    rawBrowser && rawBrowser !== "undefined" ? rawBrowser : null;

  return { deviceType, os, browser };
}
