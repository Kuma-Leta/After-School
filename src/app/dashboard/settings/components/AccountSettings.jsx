"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import DeleteAccountModal from "./DeleteAccountModal";
import { AlertCircle, Mail, Lock } from "lucide-react";

export default function AccountSettings({ user }) {
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setMessage({
        type: "success",
        text: "Confirmation email sent! Please check your inbox.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Account Settings
        </h2>
      </div>

      {/* Change Email */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Mail className="w-5 h-5 text-gray-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Change Email Address
            </h3>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF1E00] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50"
              >
                Update Email
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Lock className="w-5 h-5 text-gray-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Change Password
            </h3>
            <form
              onSubmit={handlePasswordChange}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF1E00] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF1E00] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF1E00] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Delete Account
            </h3>
            <p className="text-red-600 text-sm mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userId={user?.id}
      />

      {/* Message display */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
