import { NextResponse } from "next/server";
import { createInviteLink } from "@/lib/invite-links";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const index = Number(body?.index);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Name is required." },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(index)) {
      return NextResponse.json(
        { ok: false, error: "Index must be 1, 2, or 3." },
        { status: 400 }
      );
    }

    const created = await createInviteLink(name, index as 1 | 2 | 3);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://xobin.online";
    const inviteUrl = `${baseUrl}/invite/${created.code}`;

    return NextResponse.json(
      {
        ok: true,
        data: {
          name: created.name,
          code: created.code,
          index: created.index,
          inviteUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create invite link:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create invite link." },
      { status: 500 }
    );
  }
}

