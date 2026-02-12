"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function NotificationSettings({ userId }) {
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    message_notifications: true,
    job_alert_notifications: true,
    marketing_emails: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setMessage("Notification preferences saved!");
    } catch (error) {
      setMessage("Error saving preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const toggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Notification Settings
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Receive updates and alerts via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={() => toggle("email_notifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FF1E00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF1E00]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Browser push notifications
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.push_notifications}
                  onChange={() => toggle("push_notifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FF1E00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF1E00]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Message Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Notify me when I receive a new message
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.message_notifications}
                  onChange={() => toggle("message_notifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FF1E00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF1E00]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Job Alerts</h4>
                <p className="text-sm text-gray-600">
                  Receive alerts for new job postings matching your profile
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.job_alert_notifications}
                  onChange={() => toggle("job_alert_notifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FF1E00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF1E00]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Marketing Emails</h4>
                <p className="text-sm text-gray-600">
                  Receive tips, offers, and newsletters
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing_emails}
                  onChange={() => toggle("marketing_emails")}
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
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
