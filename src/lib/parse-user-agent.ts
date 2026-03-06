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

  const deviceType =
    result.device?.type && result.device.type !== "undefined"
      ? result.device.type
      : "desktop";
  const os = result.os?.name && result.os.name !== "undefined" ? result.os.name : null;
  const browser =
    result.browser?.name && result.browser.name !== "undefined" ? result.browser.name : null;

  return { deviceType, os, browser };
}
