import { NextResponse } from "next/server";
import { getPaymentConfig } from "@/lib/payments";

/**
 * GET /api/payments/config
 * Public endpoint — returns which payment methods are available.
 * Used by the checkout form to show/hide payment options.
 * Does NOT expose any secrets — only boolean flags.
 */
export async function GET() {
  const config = getPaymentConfig();

  // Only expose what the frontend needs — no secrets
  return NextResponse.json({
    demoMode: config.demoMode,
    currency: config.currency,
    methods: {
      telebirr: config.methods.telebirr.available,
      cbe: config.methods.cbe.available,
      paypal: config.methods.paypal.available,
      card: config.methods.card.available,
      mpesa: config.methods.mpesa.available,
    },
    labels: {
      telebirr: config.methods.telebirr.label,
      cbe: config.methods.cbe.label,
      paypal: config.methods.paypal.label,
      card: config.methods.card.label,
      mpesa: config.methods.mpesa.label,
    },
    icons: {
      telebirr: config.methods.telebirr.icon,
      cbe: config.methods.cbe.icon,
      paypal: config.methods.paypal.icon,
      card: config.methods.card.icon,
      mpesa: config.methods.mpesa.icon,
    },
    configuredCount: config.configuredCount,
  });
}
