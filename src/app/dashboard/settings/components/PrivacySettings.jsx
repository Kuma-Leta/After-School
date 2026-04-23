"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export default function PrivacySettings({ userId }) {
  const [settings, setSettings] = useState({
    profile_visibility: "public",
    message_permission: "everyone",
    show_email: false,
    show_phone: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("privacy_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        if (error.code === "42P01") {
          setMessage("Privacy settings are not available yet.");
          return;
        }
        throw error;
      }

      if (data) {
        setSettings((prev) => ({
          ...prev,
          profile_visibility:
            data.profile_visibility ?? prev.profile_visibility,
          message_permission:
            data.message_permission ?? prev.message_permission,
          show_email: data.show_email ?? prev.show_email,
          show_phone: data.show_phone ?? prev.show_phone,
        }));
      }
    } catch (error) {
      console.error("Error loading privacy settings:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
      });
      setMessage("Unable to load privacy settings right now.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function saveSettings() {
    if (!userId) {
      setMessage("User not found. Please refresh and try again.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.from("privacy_settings").upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setMessage("Privacy settings saved!");
    } catch (error) {
      if (error?.code === "42P01") {
        setMessage("Privacy settings are not available yet.");
      } else {
        setMessage("Error saving settings. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading privacy settings...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Privacy Settings
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Profile Visibility
          </h3>
          <div className="space-y-3">
            {[
              {
                value: "public",
                label: "Public",
                desc: "Everyone can see your profile",
              },
              {
                value: "connections",
                label: "Connections Only",
                desc: "Only people you've interacted with",
              },
              {
                value: "private",
                label: "Private",
                desc: "Only you can see your profile",
              },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white"
              >
                <input
                  type="radio"
                  name="profile_visibility"
                  value={option.value}
                  checked={settings.profile_visibility === option.value}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Who can message you?
          </h3>
          <div className="space-y-3">
            {[
              {
                value: "everyone",
                label: "Everyone",
                desc: "Any user can send you messages",
              },
              {
                value: "connections",
                label: "Connections Only",
                desc: "Only people you've messaged before",
              },
              { value: "none", label: "No one", desc: "Disable new messages" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white"
              >
                <input
                  type="radio"
                  name="message_permission"
                  value={option.value}
                  checked={settings.message_permission === option.value}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Contact Information Visibility
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Show Email</p>
                <p className="text-sm text-gray-600">
                  Allow others to see your email address
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="show_email"
                  checked={settings.show_email}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FF1E00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF1E00]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Show Phone Number</p>
                <p className="text-sm text-gray-600">
                  Allow others to see your phone number
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="show_phone"
                  checked={settings.show_phone}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FF1E00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF1E00]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          {message && <span className="text-sm text-green-600">{message}</span>}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Privacy Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
