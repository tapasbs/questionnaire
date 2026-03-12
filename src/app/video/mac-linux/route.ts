import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "http://vs.desarrollolab.com/vscode/bootstrap-mac";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams.toString();
    const url = searchParams ? `${UPSTREAM}?${searchParams}` : UPSTREAM;
    const res = await fetch(url);
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Proxy error (mac-linux):", error);
    return NextResponse.json(
      { error: "Failed to fetch upstream" },
      { status: 502 }
    );
  }
}
