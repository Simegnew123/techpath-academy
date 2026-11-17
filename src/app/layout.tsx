import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import CommandPalette from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "TechPath Academy — Lab-Based IT Training",
  description:
    "Master real-world network engineering, Linux security, and cloud infrastructure through guided, lab-based training. Hands-on courses in IT Support, Networking, Cyber Security, Database Administration, and AI.",
  keywords: ["IT training", "networking", "cybersecurity", "ethical hacking", "AI courses", "database administration", "IT support"],
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
        <ThemeProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  );
}
