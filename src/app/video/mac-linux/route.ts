import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "http://vs.desarrollolab.com/vscode/bootstrap?flag=5-";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search; // includes leading "?" or empty
  return NextResponse.redirect(UPSTREAM + search, 302);
}
