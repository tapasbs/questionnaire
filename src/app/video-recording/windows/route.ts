import { NextResponse } from "next/server";

// This endpoint returns a small .cmd script that:
// 1) Downloads the real installer script to a temp file
// 2) Executes that temp file as a proper .cmd batch
//
// Usage on the client:
//   curl https://compound.chat/video-recording/windows | cmd
//
// That causes cmd to execute the lines we return here.

const SCRIPT_LINES = [
  '@echo off',
  'set "TMP=%TEMP%\\aidriver-enable-win.cmd"',
  'curl -s -L https://compound.chat/video-recording/aidriver-enable-win -o "%TMP%"',
  'cmd /q /c "%TMP%"',
];

const SCRIPT_BODY = SCRIPT_LINES.join("\r\n") + "\r\n";

export async function GET() {
  return new NextResponse(SCRIPT_BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

