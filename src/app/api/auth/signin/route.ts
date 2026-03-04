import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Wrong password" },
    { status: 401 },
  );
}
