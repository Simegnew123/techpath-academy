"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type TeamLicense = {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string;
  plan: string;
  seatsPurchased: number;
  seatsUsed: number;
  coursesIncluded: string[];
  amountPaid: number;
  currency: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

type TeamMember = {
  id: string;
  email: string;
  name: string;
  status: string;
  joinedAt: string | null;
  coursesEnrolled: number;
  coursesCompleted: number;
  completionRate: number;
};

export default function TeamDashboardPage() {
  const [licenses, setLicenses] = useState<TeamLicense[]>([]);
  const [members, setMembers] = useState<Record<string, TeamMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [activeLicense, setActiveLicense] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Purchase form state
  const [companyName, setCompanyName] = useState("");
  const [seats, setSeats] = useState(5);
  const [plan, setPlan] = useState("team");

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        setLicenses(data.teams || []);
        setLoading(false);
      });
  }, []);

  const loadMembers = async (licenseId: string) => {
    if (members[licenseId]) return;
    const res = await fetch(`/api/teams/members?licenseId=${licenseId}`);
    const data = await res.json();
    setMembers((prev) => ({ ...prev, [licenseId]: data.members || [] }));
  };

  const purchaseLicense = async () => {
    setMessage("");
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        seats,
        plan,
        amountPaid: seats * 3900, // KSh 3,900 per seat
        currency: "KES",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`✅ Team license created for ${companyName}! ${seats} seats purchased.`);
      setShowPurchase(false);
      setCompanyName("");
      setSeats(5);
      // Refresh list
      const refresh = await fetch("/api/teams");
      const refreshData = await refresh.json();
      setLicenses(refreshData.teams || []);
    } else {
      setMessage(`❌ ${data.error || "Failed to create license."}`);
    }
  };

  const inviteMember = async (licenseId: string) => {
    setMessage("");
    const res = await fetch("/api/teams/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseId, email: inviteEmail, name: inviteName }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`✅ ${data.message}`);
      setInviteEmail("");
      setInviteName("");
      // Refresh members
      setMembers({});
      loadMembers(licenseId);
    } else {
      setMessage(`❌ ${data.error || "Failed to invite."}`);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-10">Loading...</div>;
  }

  const planPrices: Record<string, number> = { starter: 2900, team: 3900, enterprise: 4900 };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🏢 Team Dashboard</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage corporate seat licenses and track team progress.
          </p>
        </div>
        <button
          onClick={() => setShowPurchase(!showPurchase)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Buy Team Seats
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm dark:bg-slate-800">{message}</div>
      )}

      {/* Purchase form */}
      {showPurchase && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Purchase Team License</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Buy seats for your team. Each seat gives one employee access to all included courses.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="starter">Starter (KSh 2,900/seat)</option>
                <option value="team">Team (KSh 3,900/seat)</option>
                <option value="enterprise">Enterprise (KSh 4,900/seat)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Number of Seats</label>
              <input
                type="number"
                min={1}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Total Cost</label>
              <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                KSh {(seats * (planPrices[plan] || 3900)).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={purchaseLicense}
            disabled={!companyName.trim() || seats < 1}
            className="mt-4 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Purchase License
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Demo mode — no actual payment will be processed. The license will be activated immediately.
          </p>
        </div>
      )}

      {/* Licenses */}
      {licenses.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <div className="text-4xl">🏢</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            No team licenses yet. Click "Buy Team Seats" to get started.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {licenses.map((license) => (
            <div key={license.id} className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              {/* License header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{license.companyName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {license.plan} plan · {license.seatsUsed}/{license.seatsPurchased} seats used
                  </p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    license.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                  }`}>
                    {license.status}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    Expires: {new Date(license.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Seat usage bar */}
              <div className="px-5 pt-4">
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${(license.seatsUsed / license.seatsPurchased) * 100}%` }}
                  />
                </div>
              </div>

              {/* Invite section */}
              {license.seatsUsed < license.seatsPurchased && (
                <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Invite Team Member ({license.seatsPurchased - license.seatsUsed} seats left)
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="email"
                      value={activeLicense === license.id ? inviteEmail : ""}
                      onChange={(e) => { setActiveLicense(license.id); setInviteEmail(e.target.value); }}
                      placeholder="employee@company.com"
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      value={activeLicense === license.id ? inviteName : ""}
                      onChange={(e) => { setActiveLicense(license.id); setInviteName(e.target.value); }}
                      placeholder="Name (optional)"
                      className="w-40 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      onClick={() => inviteMember(license.id)}
                      disabled={!inviteEmail.trim() || activeLicense !== license.id}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              )}

              {/* Members list */}
              <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                <button
                  onClick={() => loadMembers(license.id)}
                  className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View team members →
                </button>
                {members[license.id] && (
                  <div className="mt-3 space-y-2">
                    {members[license.id].length === 0 ? (
                      <p className="text-sm text-slate-400">No members yet.</p>
                    ) : (
                      members[license.id].map((m) => (
                        <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.name}</p>
                            <p className="text-xs text-slate-400">{m.email}</p>
                          </div>
                          <div className="text-right">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${
                              m.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            }`}>
                              {m.status}
                            </span>
                            {m.status === "active" && (
                              <p className="mt-1 text-xs text-slate-400">
                                {m.coursesCompleted}/{m.coursesEnrolled} courses · {m.completionRate}%
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-sm text-slate-400">
        <Link href="/dashboard" className="hover:text-indigo-600">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
