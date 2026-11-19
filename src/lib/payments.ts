/**
 * payments.ts — Central payment configuration, verification, and helpers.
 *
 * Supports:
 * - Demo mode (PAYMENT_MODE=demo): all payments auto-complete for testing
 * - Live mode (PAYMENT_MODE=live): real payment processing
 *   - PayPal (international) — OAuth2 + order capture
 *   - Flutterwave (Card + M-Pesa) — API redirect + server-side verify
 *   - Telebirr / CBE (manual) — show account info, admin verifies
 *
 * Environment variables (set on Render → Environment):
 *   PAYMENT_MODE          "demo" (default) or "live"
 *   SITE_URL              e.g. https://techpath-academy.onrender.com
 *   CURRENCY              e.g. KES, USD, ETB (default KES)
 *
 *   # PayPal (https://developer.paypal.com → My Apps & Credentials)
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_SANDBOX        "true" to use sandbox API (testing)
 *
 *   # Flutterwave (https://dashboard.flutterwave.com/dashboard/settings/apis)
 *   FLW_SECRET_KEY
 *   FLW_PUBLIC_KEY
 *
 *   # Manual payment account details (shown to users at checkout)
 *   TELEBIRR_ACCOUNT      e.g. 0912345678
 *   TELEBIRR_ACCOUNT_NAME e.g. TechPath Academy
 *   CBE_ACCOUNT           e.g. 1000203040506070
 *   CBE_ACCOUNT_NAME      e.g. TechPath Academy Pvt. Ltd.
 */

export type PaymentMethod = "telebirr" | "cbe" | "paypal" | "card" | "mpesa" | "demo";

export interface PaymentConfig {
  demoMode: boolean;
  currency: string;
  siteUrl: string;
  methods: {
    telebirr: { available: boolean; label: string; sub: string; icon: string };
    cbe: { available: boolean; label: string; sub: string; icon: string };
    paypal: { available: boolean; label: string; sub: string; icon: string };
    card: { available: boolean; label: string; sub: string; icon: string };
    mpesa: { available: boolean; label: string; sub: string; icon: string };
  };
  configuredCount: number;
}

export function getPaymentConfig(): PaymentConfig {
  const demoMode = (process.env.PAYMENT_MODE || "demo") !== "live";
  const paypalOk = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const flwOk = !!(process.env.FLW_SECRET_KEY && process.env.FLW_PUBLIC_KEY);

  const methods = {
    telebirr: { available: true, label: "Telebirr", sub: "Ethio Telecom mobile money", icon: "📲" },
    cbe: { available: true, label: "CBE Bank Transfer", sub: "Commercial Bank of Ethiopia", icon: "🏦" },
    paypal: { available: paypalOk, label: "PayPal", sub: "International payments", icon: "🅿️" },
    card: { available: flwOk, label: "Card", sub: "Visa / Mastercard via Flutterwave", icon: "💳" },
    mpesa: { available: flwOk, label: "M-Pesa", sub: "Mobile money (Kenya) via Flutterwave", icon: "📱" },
  };

  const configuredCount = Object.values(methods).filter((m) => m.available).length;

  return {
    demoMode,
    currency: process.env.CURRENCY || "KES",
    siteUrl: process.env.SITE_URL || "",
    methods,
    configuredCount,
  };
}

// ── Manual payment account details (env-configurable) ──

export interface ManualPaymentInfo {
  account: string;
  name: string;
  note: string;
}

export function getManualPaymentInfo(method: "telebirr" | "cbe"): ManualPaymentInfo {
  if (method === "telebirr") {
    return {
      account: process.env.TELEBIRR_ACCOUNT || "0912-345-678",
      name: process.env.TELEBIRR_ACCOUNT_NAME || "TechPath Academy",
      note: "Open the Telebirr app or dial *127# → Send Money → Enter the number above. Use your email as the reference.",
    };
  }
  return {
    account: process.env.CBE_ACCOUNT || "1000-2030-4050-6070",
    name: process.env.CBE_ACCOUNT_NAME || "TechPath Academy Pvt. Ltd.",
    note: "Transfer to the CBE account above via CBE Birr, CBE Internet Banking, or bank visit. Email your transfer receipt to ademezerihun2013@gmail.com.",
  };
}

// ── PayPal helpers ──

function getPayPalBaseUrl(): string {
  return process.env.PAYPAL_SANDBOX === "true"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

export async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) return null;

  try {
    const res = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Capture a PayPal payment after user approval.
 * Returns true if the capture was successful.
 */
export async function capturePayPalPayment(orderId: string): Promise<{
  success: boolean;
  ref?: string;
  error?: string;
}> {
  const token = await getPayPalAccessToken();
  if (!token) return { success: false, error: "PayPal auth failed" };

  try {
    const res = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data?.message || "PayPal capture failed" };
    }

    // Check if capture was completed
    const purchaseUnit = data.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    if (capture?.status === "COMPLETED") {
      return { success: true, ref: capture.id || orderId };
    }

    return { success: false, error: `PayPal status: ${capture?.status || "unknown"}` };
  } catch (e) {
    return { success: false, error: "PayPal service unavailable" };
  }
}

// ── Flutterwave helpers ──

/**
 * Verify a Flutterwave transaction server-side.
 * This is CRITICAL — never trust the redirect URL params alone.
 * Returns true only if the transaction is verified successful and amount matches.
 */
export async function verifyFlutterwavePayment(
  transactionId: string,
  expectedAmount: number,
  expectedCurrency: string
): Promise<{ success: boolean; ref?: string; error?: string }> {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) return { success: false, error: "Flutterwave not configured" };

  try {
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    if (!res.ok || data.status !== "success") {
      return { success: false, error: data?.message || "Flutterwave verification failed" };
    }

    const tx = data.data;
    if (!tx) return { success: false, error: "No transaction data" };

    // Security checks
    if (tx.status !== "successful") {
      return { success: false, error: `Transaction status: ${tx.status}` };
    }
    if (tx.amount !== expectedAmount) {
      return { success: false, error: `Amount mismatch: expected ${expectedAmount}, got ${tx.amount}` };
    }
    if (tx.currency && tx.currency !== expectedCurrency) {
      return { success: false, error: `Currency mismatch: expected ${expectedCurrency}, got ${tx.currency}` };
    }

    return { success: true, ref: tx.tx_ref || transactionId };
  } catch {
    return { success: false, error: "Flutterwave service unavailable" };
  }
}
