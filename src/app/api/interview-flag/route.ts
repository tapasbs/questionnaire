import { NextResponse } from "next/server";
import { getInterviewCollection } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";

    if (!inviteCode) {
      return NextResponse.json({ ok: false, error: "inviteCode is required" }, { status: 400 });
    }

    const collection = await getInterviewCollection<{
      inviteCode: string;
      flag: boolean;
      copiedAt: Date;
    }>();

    await collection.updateOne(
      { inviteCode },
      {
        $set: {
          inviteCode,
          flag: true,
          copiedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error setting interview flag", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

