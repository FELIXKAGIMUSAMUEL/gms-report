"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import { UserIcon, EnvelopeIcon, LockClosedIcon, CheckCircleIcon, ExclamationCircleIcon, CameraIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
        }));
        setAvatarUrl(data.avatarUrl || null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl);
        setAvatarPreview(null);
        await update(); // refresh session so navbar updates
        setMessage({ type: "success", text: "Profile picture updated!" });
      } else {
        setAvatarPreview(null);
        setMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch {
      setAvatarPreview(null);
      setMessage({ type: "error", text: "Upload failed. Please try again." });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) {
        setAvatarUrl(null);
        setAvatarPreview(null);
        await update();
        setMessage({ type: "success", text: "Profile picture removed." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove picture." });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }

    if (!formData.email.trim()) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        
        // Refresh the entire session to pick up changes from JWT
        // This will re-evaluate the JWT and update the session with new name/email
        await update();

        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout showPeriodFilters={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showPeriodFilters={false}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and password</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
            ) : (
              <ExclamationCircleIcon className="w-6 h-6 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Avatar card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              {/* Avatar preview */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100 shadow-md">
                  <img
                    src={avatarPreview ?? (avatarUrl ? avatarUrl + "?t=" + Date.now() : "/User_Avatar.png")}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500">JPG, PNG or WebP · max 3 MB</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <CameraIcon className="w-4 h-4" />
                    {avatarUrl ? "Change picture" : "Upload picture"}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold">Role:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {session?.user?.role}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
            <p className="text-sm text-gray-600 mb-6">Leave blank to keep your current password</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  <LockClosedIcon className="w-4 h-4 inline mr-1" />
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  <LockClosedIcon className="w-4 h-4 inline mr-1" />
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  <LockClosedIcon className="w-4 h-4 inline mr-1" />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white placeholder:text-gray-400 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
