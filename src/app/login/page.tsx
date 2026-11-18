import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Welcome back 👋</h1>
      <p className="mt-1 text-slate-500">Log in to continue learning.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Suspense fallback={<div className="text-center text-slate-400">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-slate-400 dark:text-slate-500">
        <Link href="/forgot-password" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
