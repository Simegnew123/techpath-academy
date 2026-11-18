"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  createdAt: string;
  enrollments: number;
  certificates: number;
};

const ROLES = ["student", "instructor", "admin", "teaching_assistant", "auditor"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function changeRole(userId: string, role: string) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "role", role }),
    });
    if (res.ok) await fetchUsers();
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete user "${name}"? This will remove all their data (enrollments, certificates, progress). This cannot be undone.`)) return;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "delete" }),
    });
    if (res.ok) await fetchUsers();
  }

  async function resetPassword(userId: string, name: string) {
    const pw = prompt(`Reset password for "${name}". Enter a new password (min 6 chars):`);
    if (!pw) return;
    if (pw.length < 6) { alert("Password must be at least 6 characters."); return; }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "reset_password", newPassword: pw }),
    });
    if (res.ok) {
      alert(`Password for "${name}" has been reset. Share the new password with the user.`);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to reset password.");
    }
  }

  const filtered = users.filter(u =>
    !filter ||
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase()) ||
    u.role.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500">Manage roles and accounts · {users.length} users</p>
        </div>
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Back to Admin</Link>
      </div>

      {/* Filter */}
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search by name, email, or role..."
        className="mb-4 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
        aria-label="Filter users"
      />

      {/* User table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-center font-semibold">Courses</th>
              <th className="px-4 py-3 text-center font-semibold">Certs</th>
              <th className="px-4 py-3 text-left font-semibold">Joined</th>
              <th className="px-4 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-indigo-400"
                    aria-label={`Change role for ${u.name}`}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{u.enrollments}</td>
                <td className="px-4 py-3 text-center text-slate-600">{u.certificates}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => resetPassword(u.id, u.name)}
                      className="rounded-lg px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                      aria-label={`Reset password for ${u.name}`}
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => deleteUser(u.id, u.name)}
                      className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      aria-label={`Delete user ${u.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
