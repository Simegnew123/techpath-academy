import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, mutate } from "@/lib/store";
import { generateTOTPSecret, buildOTPAURI, verifyTOTP } from "@/lib/totp";
import QRCode from "qrcode";

// POST /api/auth/mfa-setup — generate a new TOTP secret + QR code
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "generate");

  if (action === "generate") {
    // Generate a new secret (don't save yet — user must verify first)
    const secret = generateTOTPSecret();
    const uri = buildOTPAURI(user.email, secret);
    const qrDataUrl = await QRCode.toDataURL(uri, { width: 220, margin: 1 });

    // Temporarily store the pending secret on the user record
    mutate((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (u) u.mfaSecret = secret;
    });

    return NextResponse.json({
      secret,
      qrCode: qrDataUrl,
      uri,
      message: "Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.",
    });
  }

  if (action === "confirm") {
    // Verify the TOTP code and enable MFA
    const code = String(body?.code || "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter a valid 6-digit code." }, { status: 400 });
    }

    const db = readDB();
    const fullUser = db.users.find((u) => u.id === user.id);
    if (!fullUser || !fullUser.mfaSecret) {
      return NextResponse.json({ error: "No pending MFA setup. Generate a new secret first." }, { status: 400 });
    }

    if (!verifyTOTP(fullUser.mfaSecret, code)) {
      return NextResponse.json({ error: "Invalid code. Try again." }, { status: 401 });
    }

    // Enable MFA
    mutate((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (u) u.mfaEnabled = true;
    });

    return NextResponse.json({ success: true, message: "MFA enabled successfully!" });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
