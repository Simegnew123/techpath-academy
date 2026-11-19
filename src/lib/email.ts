import nodemailer, { Transporter } from "nodemailer";

/* ─────────────────────────────────────────────
   Email Service — TechPath Academy
   Sends: welcome, payment receipt, course completion
   Gracefully degrades to console log if SMTP not configured
   ───────────────────────────────────────────── */

type EmailVars = {
  to: string;
  toName: string;
  subject: string;
  html: string;
};

// ── SMTP Transport ──
let cachedTransport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransport;
}

// ── Sender info ──
const FROM_NAME = process.env.SMTP_FROM_NAME || "TechPath Academy";
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@techpath.academy";
const SITE_URL = process.env.SITE_URL || "https://techpath-academy.onrender.com";

// ── Base template ──
function emailTemplate(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;min-height:100vh;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 40px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">🎓 TechPath Academy</h1>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${title}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          ${contentHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
            TechPath Academy — ${SITE_URL}<br>
            You received this email because you have an account with us.
            If you have questions, contact <a href="mailto:${process.env.ADMIN_EMAIL || FROM_EMAIL}" style="color:#6366f1;">${process.env.ADMIN_EMAIL || FROM_EMAIL}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Core send function ──
async function sendEmail({ to, toName, subject, html }: EmailVars): Promise<boolean> {
  const transport = getTransport();
  const fullHtml = emailTemplate(subject, html);

  if (!transport) {
    // Graceful degradation — log to console (dev mode)
    console.log(`\n📧 [EMAIL] ─────────────────────────────`);
    console.log(`   To: ${toName} <${to}>`);
    console.log(`   Subject: ${subject}`);
    console.log(`   ⚠️  SMTP not configured — email not actually sent`);
    console.log(`   Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable real delivery\n`);
    return false;
  }

  try {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: `"${toName}" <${to}>`,
      subject,
      html: fullHtml,
    });
    console.log(`📧 [EMAIL] Sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error(`📧 [EMAIL] Failed to send "${subject}" to ${to}:`, (err as Error).message);
    return false;
  }
}

/* ─────────────────────────────────────────────
   EMAIL TEMPLATES
   ───────────────────────────────────────────── */

export async function sendWelcomeEmail(
  name: string,
  email: string,
  role: string
): Promise<void> {
  const isFirstUser = role === "admin";
  const contentHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b;">Welcome, ${name.split(" ")[0]}! 👋</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
      ${isFirstUser
        ? "Your TechPath Academy account has been created with <strong>Admin access</strong>. You can create courses, manage students, and configure your platform from the Admin Dashboard."
        : "Your TechPath Academy account is ready. You can now explore courses, track your progress, earn certificates, and access our book library."
      }
    </p>
    <div style="background:#f1f5f9;border-radius:10px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Your Account</p>
      <p style="margin:0;font-size:14px;color:#334155;"><strong>Name:</strong> ${name}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#334155;"><strong>Email:</strong> ${email}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#334155;"><strong>Role:</strong> ${isFirstUser ? "Administrator 👑" : "Student 🎓"}</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}${isFirstUser ? "/admin" : "/courses"}"
         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:8px;">
        ${isFirstUser ? "Go to Admin Dashboard →" : "Browse Courses →"}
      </a>
    </div>
    <p style="margin:24px 0 0;font-size:14px;color:#475569;line-height:1.7;">
      Here's what you can do right now:
    </p>
    <ul style="margin:8px 0 0;padding-left:20px;color:#475569;font-size:14px;line-height:2;">
      <li>Browse ${isFirstUser ? "and create " : ""}courses across 6 IT categories</li>
      <li>Access the free book library with hundreds of resources</li>
      <li>Track your learning progress and streaks</li>
      <li>Earn verifiable certificates with QR codes</li>
    </ul>`;

  await sendEmail({
    to: email,
    toName: name,
    subject: isFirstUser ? "Welcome to TechPath Academy — Admin Access Granted" : "Welcome to TechPath Academy!",
    html: contentHtml,
  });
}

export async function sendPaymentReceiptEmail(
  name: string,
  email: string,
  courseTitle: string,
  courseSlug: string,
  amount: number,
  currency: string,
  method: string,
  ref: string
): Promise<void> {
  const methodName = method === "telebirr" ? "Telebirr" :
    method === "cbe" ? "CBE Bank Transfer" :
    method === "paypal" ? "PayPal" :
    method === "card" ? "Debit/Credit Card" :
    method === "mpesa" ? "M-Pesa" : method;

  const contentHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b;">✅ Payment Confirmed</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
      Hi ${name.split(" ")[0]}, your payment has been confirmed and you're now enrolled in the course below.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin:20px 0;overflow:hidden;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Course</span><br>
        <span style="font-size:16px;font-weight:600;color:#1e293b;">${courseTitle}</span>
      </td></tr>
      <tr><td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Amount</span><br>
        <span style="font-size:18px;font-weight:700;color:#059669;">${currency} ${amount.toLocaleString()}</span>
      </td></tr>
      <tr><td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Payment Method</span><br>
        <span style="font-size:14px;color:#334155;">${methodName}</span>
      </td></tr>
      <tr><td style="padding:12px 20px;">
        <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Reference Number</span><br>
        <span style="font-size:13px;color:#334155;font-family:monospace;background:#e2e8f0;padding:2px 8px;border-radius:4px;">${ref}</span>
      </td></tr>
    </table>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}/courses/${courseSlug}/chapters"
         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:8px;">
        Start Learning Now →
      </a>
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
      Please keep this email as your receipt. If you didn't make this payment, please contact us immediately.
    </p>`;

  await sendEmail({
    to: email,
    toName: name,
    subject: `Payment Receipt — ${courseTitle}`,
    html: contentHtml,
  });
}

export async function sendCourseCompletionEmail(
  name: string,
  email: string,
  courseTitle: string,
  courseSlug: string,
  certCode: string
): Promise<void> {
  const contentHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b;">🏅 Course Completed!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
      Congratulations, ${name.split(" ")[0]}! You've successfully completed all lessons in <strong>${courseTitle}</strong> at TechPath Academy.
    </p>
    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#16a34a;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Certificate of Completion</p>
      <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#15803d;">${courseTitle}</p>
      <p style="margin:0;font-size:13px;color:#475569;">Awarded to <strong>${name}</strong></p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;font-family:monospace;">Cert Code: ${certCode}</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}/certificates/${certCode}"
         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:8px;">
        View & Download Certificate →
      </a>
    </div>
    <p style="margin:24px 0 0;font-size:14px;color:#475569;line-height:1.7;">
      Your certificate includes a QR code for verification and can be shared on LinkedIn or with employers.
    </p>
    <p style="margin:16px 0 0;font-size:14px;color:#475569;">
      Ready for your next course? <a href="${SITE_URL}/courses" style="color:#6366f1;font-weight:600;">Browse more courses →</a>
    </p>`;

  await sendEmail({
    to: email,
    toName: name,
    subject: `🏅 Certificate Earned — ${courseTitle}`,
    html: contentHtml,
  });
}

/* ── Admin notification email (optional) ── */
export async function sendAdminNotificationEmail(
  subject: string,
  message: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  await sendEmail({
    to: adminEmail,
    toName: "Admin",
    subject: `[TechPath] ${subject}`,
    html: `<p style="font-size:15px;color:#475569;line-height:1.7;">${message}</p>`,
  });
}
