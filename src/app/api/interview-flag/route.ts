import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const inviteCodeRaw = typeof body.inviteCode === "string" ? body.inviteCode : "";
    const inviteCode = inviteCodeRaw.trim();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const profileUrl = String(body.profileUrl ?? "").trim();

    if (!inviteCode) {
      return NextResponse.json({ ok: false, error: "inviteCode is required" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection<{
      inviteCode: string | null;
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
      profileUrl?: string | null;
      interviewFlag?: boolean;
      interviewFlagCopiedAt?: Date;
      createdAt?: Date;
      updatedAt?: Date;
    }>("questionnaire_leads");

    const now = new Date();

    const update: Record<string, unknown> = {
      inviteCode,
      interviewFlag: true,
      interviewFlagCopiedAt: now,
      updatedAt: now,
    };

    if (fullName) update.fullName = fullName;
    if (email) update.email = email;
    if (phone) update.phone = phone;
    if (profileUrl) update.profileUrl = profileUrl;

    await collection.updateOne(
      { inviteCode },
      {
        $set: update,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error setting interview flag", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

