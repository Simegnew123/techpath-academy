import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDB } from "@/lib/store";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Get full user record (getCurrentUser may omit some fields)
  const db = readDB();
  const fullUser = db.users.find((u) => u.id === user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Account Settings</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Change your password, manage your security question, and configure two-factor authentication.
      </p>
      <div className="mt-6">
        <SettingsForm
          email={user.email}
          name={user.name}
          hasSecurityQuestion={!!fullUser?.securityQuestion}
          currentQuestion={fullUser?.securityQuestion || ""}
          mfaEnabled={!!fullUser?.mfaEnabled}
        />
      </div>
    </div>
  );
}
