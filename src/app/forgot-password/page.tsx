import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Forgot your password?</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        No worries — answer your security question to set a new password.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
