import Link from "next/link";
import QRCode from "qrcode";
import { headers } from "next/headers";

export const revalidate = 3600; // Re-generate QR every hour

export default async function InstallPage() {
  // Get the site URL from request headers or fallback
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "techpath-academy.onrender.com";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const siteUrl = `${proto}://${host}`;

  // Generate QR code as data URL
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(siteUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#4f46e5", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
  } catch {
    qrDataUrl = "";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline dark:text-indigo-400">
        ← Back to Home
      </Link>

      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
          <span className="text-4xl font-bold text-white">T</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Install TechPath Academy
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Get the full app experience on your phone or computer — works offline, no app store needed.
        </p>
      </div>

      {/* QR Code Section */}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {/* QR Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
            📱 Scan to Install on Mobile
          </h2>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR code to install TechPath Academy"
              width={280}
              height={280}
              className="mx-auto rounded-xl border-4 border-indigo-100 dark:border-indigo-900"
            />
          ) : (
            <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
              <span className="text-sm text-slate-400">QR unavailable</span>
            </div>
          )}
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Point your phone camera at this code, then tap "Add to Home Screen"
          </p>
        </div>

        {/* Instructions Card */}
        <div className="space-y-5">
          {/* Android */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              🤖 Android (Chrome)
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>1. Open this site in Chrome</li>
              <li>2. Tap the menu (⋮) in the top right</li>
              <li>3. Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
              <li>4. Tap <strong>"Install"</strong></li>
            </ol>
          </div>

          {/* iOS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              🍎 iPhone / iPad (Safari)
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>1. Open this site in <strong>Safari</strong> (not Chrome)</li>
              <li>2. Tap the <strong>Share</strong> button (□↑ at bottom)</li>
              <li>3. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>4. Tap <strong>"Add"</strong></li>
            </ol>
          </div>

          {/* Desktop */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              💻 Desktop (Chrome / Edge)
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>1. Look for the <strong>install icon</strong> (⊕) in the address bar</li>
              <li>2. Click it and select <strong>"Install"</strong></li>
              <li>3. Or click the floating <strong>"Install App"</strong> button</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 dark:from-indigo-950/40 dark:to-purple-950/40">
        <h2 className="mb-4 text-center text-lg font-semibold text-slate-800 dark:text-slate-200">
          Why Install the App?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl">📱</div>
            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Native App Feel</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Full screen, app icon, smooth animations</p>
          </div>
          <div className="text-center">
            <div className="text-3xl">📴</div>
            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Works Offline</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Access cached lessons without internet</p>
          </div>
          <div className="text-center">
            <div className="text-3xl">⚡</div>
            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Fast Loading</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Instant startup, no browser needed</p>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        TechPath Academy PWA · No app store required · Free to install · {siteUrl}
      </p>
    </div>
  );
}
