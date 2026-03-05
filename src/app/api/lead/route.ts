import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim() || null;
    const profileUrl = String(body.profileUrl ?? "").trim() || null;
    const inviteCode = body.inviteCode ? String(body.inviteCode) : null;

    if (!fullName && !email && !phone && !profileUrl) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const db = await getDb();
    const collection = db.collection("questionnaire_leads");

    const now = new Date();

    await collection.insertOne({
      fullName: fullName || null,
      email: email || null,
      phone,
      profileUrl,
      inviteCode,
      interviewFlag: false,
      createdAt: now,
      updatedAt: now,
      source: "lead-auto",
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving lead", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

