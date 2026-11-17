import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBotIntegration, upsertBotIntegration } from "@/lib/store";
import https from "https";

// GET /api/bot-integrations — get user's bot integration
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integration = getBotIntegration(user.id);
  return NextResponse.json({ integration });
}

// POST /api/bot-integrations — connect or update bot integration
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Test Telegram bot connection
  if (body.action === "test" && body.platform === "telegram") {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 400 });
    }
    try {
      const result = await sendTelegramMessage(body.chatId, "✅ TechPath Academy connected! You'll receive study reminders here.");
      return NextResponse.json({ success: true, result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Save integration
  const integration = upsertBotIntegration(user.id, {
    platform: body.platform,
    chatId: body.chatId,
    isActive: body.isActive ?? true,
    preferences: body.preferences,
  });
  return NextResponse.json({ integration });
}

// DELETE /api/bot-integrations — disconnect bot
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  upsertBotIntegration(user.id, { isActive: false });
  return NextResponse.json({ success: true });
}

// Helper: send Telegram message
export async function sendTelegramMessage(chatId: string, text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) { reject(new Error("TELEGRAM_BOT_TOKEN not set")); return; }
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" });
    const options = {
      hostname: "api.telegram.org",
      path: `/bot${token}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error(`Telegram API error: ${res.statusCode}`));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
