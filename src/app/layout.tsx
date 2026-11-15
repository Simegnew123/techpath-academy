import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "TechPath Academy — IT Courses & Training",
  description:
    "Learn IT Support, Networking, Database Administration, Cyber Security and Ethical Hacking. Free tutorials and premium courses.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} TechPath Academy · Build real IT skills.
          </div>
        </footer>
      </body>
    </html>
  );
}
