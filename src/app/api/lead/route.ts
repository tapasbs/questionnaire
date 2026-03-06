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
    "New lead",
    `Full name: ${lead.fullName ?? "-"}`,
    `Email: ${lead.email ?? "-"}`,
    `Phone: ${lead.phone ?? "-"}`,
    `Profile URL: ${lead.profileUrl ?? "-"}`,
    `Invite code: ${lead.inviteCode ?? "-"}`,
    `Source: ${lead.source ?? "-"}`,
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

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim() || null;
    const profileUrl = String(body.profileUrl ?? "").trim() || null;
    const inviteCode = body.inviteCode ? String(body.inviteCode) : null;

    const clientIp = typeof body.clientIp === "string" ? body.clientIp.trim() : "";
    const ipAddress = clientIp || getClientIp(request.headers);
    const country =
      typeof body.country === "string" ? body.country.trim() || null : null;
    const ua = request.headers.get("user-agent");
    const { deviceType, os, browser } = parseUserAgent(ua);

    if (!fullName && !email && !phone && !profileUrl) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const db = await getDb();
    const collection = db.collection("questionnaire_leads");

    const now = new Date();

    const doc = {
      fullName: fullName || null,
      email: email || null,
      phone,
      profileUrl,
      inviteCode,
      interviewFlag: false,
      createdAt: now,
      updatedAt: now,
      source: "lead-auto",
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
      console.error("Error sending Telegram notification (lead)", telegramError);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving lead", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

