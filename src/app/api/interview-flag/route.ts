import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getClientIp } from "@/lib/client-ip";
import { parseUserAgent } from "@/lib/parse-user-agent";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendLeadToTelegram(lead: { [key: string]: any }) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    // Telegram is not configured; skip sending.
    return;
  }

  const lines = [
    "New interview-flag lead",
    `Invite code: ${lead.inviteCode ?? "-"}`,
    `Full name: ${lead.fullName ?? "-"}`,
    `Email: ${lead.email ?? "-"}`,
    `Phone: ${lead.phone ?? "-"}`,
    `Profile URL: ${lead.profileUrl ?? "-"}`,
    `IP address: ${lead.ipAddress ?? "-"}`,
    `Country: ${lead.country ?? "-"}`,
    `Device: ${lead.deviceType ?? "-"}`,
    `OS: ${lead.os ?? "-"}`,
    `Browser: ${lead.browser ?? "-"}`,
    `Created at: ${lead.createdAt ?? "-"}`,
  ];

  const message = lines.join("\n");

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const inviteCodeRaw = typeof body.inviteCode === "string" ? body.inviteCode : "";
    const inviteCode = inviteCodeRaw.trim();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const profileUrl = String(body.profileUrl ?? "").trim();

    const clientIp = typeof body.clientIp === "string" ? body.clientIp.trim() : "";
    const ipAddress = clientIp || getClientIp(request.headers);
    const country =
      typeof body.country === "string" ? body.country.trim() || null : null;
    const ua = request.headers.get("user-agent");
    const { deviceType, os, browser } = parseUserAgent(ua);

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
      source?: string;
      ipAddress?: string | null;
      country?: string | null;
      deviceType?: string | null;
      os?: string | null;
      browser?: string | null;
    }>("questionnaire_leads");

    const now = new Date();

    const doc = {
      inviteCode,
      fullName: fullName || null,
      email: email || null,
      phone: phone || null,
      profileUrl: profileUrl || null,
      interviewFlag: true,
      interviewFlagCopiedAt: now,
      createdAt: now,
      updatedAt: now,
      source: "interview-flag",
      ipAddress,
      country,
      deviceType: deviceType ?? null,
      os: os ?? null,
      browser: browser ?? null,
    };

    await collection.insertOne(doc);

    try {
      await sendLeadToTelegram(doc);
    } catch (telegramError) {
      console.error("Error sending Telegram notification (interview-flag)", telegramError);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error setting interview flag", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

