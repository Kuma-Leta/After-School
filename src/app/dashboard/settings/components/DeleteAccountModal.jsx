"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { X, AlertTriangle } from "lucide-react";

export default function DeleteAccountModal({ isOpen, onClose, userId }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;

    setLoading(true);
    try {
      // Note: Deleting a user via client SDK requires admin privileges.
      // For security, this should be done via a serverless function.
      // Here we'll call an edge function or use supabaseAdmin on the server.
      const { error } = await supabase.functions.invoke("delete-account", {
        body: { userId },
      });

      if (error) throw error;

      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Delete account error:", error);
      alert("Failed to delete account. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Delete Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-gray-700 mb-4">
          This action is <strong>permanent</strong> and cannot be undone. All
          your data, including conversations, applications, and profile
          information will be permanently deleted.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            Type <span className="font-mono font-bold">DELETE</span> to confirm.
          </p>
        </div>

        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE here"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Deleting..." : "Permanently Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
