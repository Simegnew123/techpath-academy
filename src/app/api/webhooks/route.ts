import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllWebhookConfigs,
  createWebhookConfig,
  updateWebhookConfig,
  deleteWebhookConfig,
  getWebhookLogs,
  logWebhookDelivery,
} from "@/lib/store";
import https from "https";
import crypto from "crypto";

// GET /api/webhooks — list webhook configs (admin only)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const logs = searchParams.get("logs") === "true";
  const webhookId = searchParams.get("webhookId");

  if (logs) {
    return NextResponse.json({ logs: getWebhookLogs(webhookId || undefined) });
  }

  return NextResponse.json({ webhooks: getAllWebhookConfigs() });
}

// POST /api/webhooks — create webhook config
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  if (!body.url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const secret = crypto.randomBytes(16).toString("hex");
  const webhook = createWebhookConfig({
    url: body.url,
    events: body.events || ["course.completed", "user.enrolled", "certificate.issued"],
    secret,
    isActive: body.isActive ?? true,
  });
  return NextResponse.json({ webhook }, { status: 201 });
}

// PATCH /api/webhooks — update webhook
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateWebhookConfig(id, updates);
  return NextResponse.json({ success: true });
}

// DELETE /api/webhooks?id=xxx — delete webhook
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteWebhookConfig(id);
  return NextResponse.json({ success: true });
}

// Export a helper for other routes to trigger webhooks
export async function triggerWebhooks(event: string, payload: Record<string, unknown>): Promise<void> {
  const { getWebhookConfigs } = await import("@/lib/store");
  const webhooks = getWebhookConfigs().filter((w) => w.events.includes(event));
  for (const wh of webhooks) {
    try {
      const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
      const url = new URL(wh.url);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TechPath-Event": event,
          "X-TechPath-Signature": crypto.createHmac("sha256", wh.secret).update(body).digest("hex"),
          "Content-Length": Buffer.byteLength(body),
        },
      };
      const req = https.request(options, (res) => {
        logWebhookDelivery(wh.id, event, body, res.statusCode || 0);
      });
      req.on("error", () => logWebhookDelivery(wh.id, event, body, 0));
      req.write(body);
      req.end();
    } catch {
      logWebhookDelivery(wh.id, event, JSON.stringify(payload), 0);
    }
  }
}
