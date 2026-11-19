import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import CommandPalette from "@/components/CommandPalette";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const BASE_URL = "https://techpath-academy.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TechPath Academy — Lab-Based IT Training",
    template: "%s | TechPath Academy",
  },
  description:
    "Master real-world IT skills through hands-on, lab-based training. Courses in IT Support, Networking, Cyber Security, Database Administration, and AI. Build job-ready skills with interactive labs, CTF challenges, and verifiable certificates.",
  keywords: [
    "IT training", "networking", "cybersecurity", "ethical hacking",
    "AI courses", "database administration", "IT support",
    "online IT courses", "lab-based training", "tech certification",
    "Ethiopia IT training", "East Africa tech academy",
  ],
  authors: [{ name: "Simegnew Ademe", url: BASE_URL }],
  creator: "Simegnew Ademe",
  publisher: "TechPath Academy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "TechPath Academy",
    title: "TechPath Academy — Lab-Based IT Training",
    description:
      "Master real-world IT skills through hands-on, lab-based training. Courses in IT Support, Networking, Cyber Security, Database Administration, and AI.",
    // opengraph-image.tsx auto-generates the image + meta tags
  },
  twitter: {
    card: "summary_large_image",
    title: "TechPath Academy — Lab-Based IT Training",
    description:
      "Master real-world IT skills through hands-on, lab-based training. IT Support, Networking, Cyber Security, Database Administration, and AI.",
    // opengraph-image.tsx is reused for Twitter cards too
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification code here when ready
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-100">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <Nav />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <CommandPalette />
          <GoogleAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
