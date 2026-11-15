import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Welcome back 👋</h1>
      <p className="mt-1 text-slate-500">Log in to continue learning.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-slate-400">
        Forgot your password? Contact support — we&apos;ll help you reset it.
      </p>
    </div>
  );
}
