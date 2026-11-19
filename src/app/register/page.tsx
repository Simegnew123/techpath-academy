import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create your account <span aria-hidden="true">🌟</span></h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Join TechPath Academy — save your courses and track progress.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
