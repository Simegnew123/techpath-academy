import { NextRequest, NextResponse } from "next/server";

// Currency conversion rates (base: KES — Kenyan Shilling)
// In production, these would be fetched from an API like exchangerate-api.com
// For this platform, we use static rates updated periodically
const RATES: Record<string, { rate: number; symbol: string; name: string }> = {
  KES: { rate: 1, symbol: "KSh", name: "Kenyan Shilling" },
  ETB: { rate: 0.65, symbol: "Br", name: "Ethiopian Birr" },     // 1 KES ≈ 0.65 ETB
  USD: { rate: 0.0077, symbol: "$", name: "US Dollar" },        // 1 KES ≈ $0.0077
  TZS: { rate: 17.5, symbol: "TSh", name: "Tanzanian Shilling" }, // 1 KES ≈ 17.5 TZS
  UGX: { rate: 28.5, symbol: "USh", name: "Ugandan Shilling" },  // 1 KES ≈ 28.5 UGX
  NGN: { rate: 11.5, symbol: "₦", name: "Nigerian Naira" },      // 1 KES ≈ 11.5 NGN
  EUR: { rate: 0.0071, symbol: "€", name: "Euro" },             // 1 KES ≈ €0.0071
  GBP: { rate: 0.0061, symbol: "£", name: "British Pound" },    // 1 KES ≈ £0.0061
};

// Detect currency from request headers (Accept-Language) or query param
function detectCurrency(req: NextRequest): string {
  // Check query param first
  const url = new URL(req.url);
  const param = url.searchParams.get("currency");
  if (param && RATES[param.toUpperCase()]) return param.toUpperCase();

  // Check Accept-Language header
  const lang = req.headers.get("accept-language") || "";
  if (lang.includes("et") || lang.includes("ET")) return "ETB";
  if (lang.includes("ke") || lang.includes("sw") || lang.includes("KE")) return "KES";
  if (lang.includes("tz") || lang.includes("TZ")) return "TZS";
  if (lang.includes("ug") || lang.includes("UG")) return "UGX";
  if (lang.includes("ng") || lang.includes("NG")) return "NGN";
  if (lang.includes("en-GB") || lang.includes("GB")) return "GBP";
  if (lang.includes("de") || lang.includes("fr") || lang.includes("EUR")) return "EUR";

  // Default to ETB (Ethiopian audience)
  return "ETB";
}

// GET /api/currency?amount=4900 — convert amount from KES to detected currency
// GET /api/currency?amount=4900&currency=USD — convert to specific currency
// GET /api/currency — just return available currencies and detected currency
export async function GET(req: NextRequest) {
  const detected = detectCurrency(req);
  const { searchParams } = new URL(req.url);
  const amountStr = searchParams.get("amount");
  const currency = (searchParams.get("currency") || detected).toUpperCase();

  if (!RATES[currency]) {
    return NextResponse.json({ error: `Unsupported currency: ${currency}` }, { status: 400 });
  }

  const currencies = Object.entries(RATES).map(([code, info]) => ({
    code,
    symbol: info.symbol,
    name: info.name,
    rate: info.rate,
  }));

  if (!amountStr) {
    return NextResponse.json({
      detectedCurrency: detected,
      currencies,
    });
  }

  const amountKES = Number(amountStr);
  if (isNaN(amountKES)) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  const target = RATES[currency];
  const converted = amountKES * target.rate;
  const formatted = `${target.symbol} ${converted.toLocaleString("en-US", {
    minimumFractionDigits: converted < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;

  return NextResponse.json({
    original: { amount: amountKES, currency: "KES", symbol: "KSh", formatted: `KSh ${amountKES.toLocaleString()}` },
    converted: { amount: converted, currency, symbol: target.symbol, formatted },
    rate: target.rate,
    detectedCurrency: detected,
    currencies,
  });
}
