"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { TrashIcon } from "@heroicons/react/24/outline";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "GM" | "TRUSTEE";
  createdAt: string;
}

export default function PrivateUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "GM",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role && session.user.role !== "GM" && session.user.role !== "TRUSTEE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/users/manage");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load users");
      }
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadUsers();
    }
  }, [status]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError("");
      const res = await fetch("/api/users/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create user");
      }
      const created = await res.json();
      setUsers((prev) => [created, ...prev]);
      setForm({ name: "", email: "", password: "", role: "GM" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id: string, role: "GM" | "TRUSTEE") => {
    try {
      setError("");
      const res = await fetch("/api/users/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update role");
      }
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleResetPassword = async (id: string, password: string) => {
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    try {
      setError("");
      const res = await fetch("/api/users/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to reset password");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      setError("");
      const res = await fetch(`/api/users/manage?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Private User Management</h1>
          <p className="text-gray-600 mt-1">Create and manage GM/Trustee accounts</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900"
              >
                <option value="GM">GM</option>
                <option value="TRUSTEE">TRUSTEE</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg"
            >
              {saving ? "Creating..." : "Create User"}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Reset Password</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onRoleChange={handleRoleChange}
                      onResetPassword={handleResetPassword}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function UserRow({
  user,
  onRoleChange,
  onResetPassword,
  onDelete,
}: {
  user: UserRow;
  onRoleChange: (id: string, role: "GM" | "TRUSTEE") => void;
  onResetPassword: (id: string, password: string) => void;
  onDelete: (id: string) => void;
}) {
  const [password, setPassword] = useState("");

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-2 text-gray-700">{user.name}</td>
      <td className="px-4 py-2 text-gray-700">{user.email}</td>
      <td className="px-4 py-2">
        <select
          value={user.role}
          onChange={(e) => onRoleChange(user.id, e.target.value as "GM" | "TRUSTEE")}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="GM">GM</option>
          <option value="TRUSTEE">TRUSTEE</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="New password"
          />
          <button
            onClick={() => {
              onResetPassword(user.id, password);
              setPassword("");
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
          >
            Reset
          </button>
        </div>
      </td>
      <td className="px-4 py-2">
        <button
          onClick={() => onDelete(user.id)}
          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
        >
          <TrashIcon className="w-4 h-4" />
          Delete
        </button>
      </td>
    </tr>
  );
}
