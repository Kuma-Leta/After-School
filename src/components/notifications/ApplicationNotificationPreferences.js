// components/notifications/ApplicationNotificationPreferences.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Bell, Briefcase, Mail, X, Check } from "lucide-react";

export function ApplicationNotificationPreferences() {
  const [preferences, setPreferences] = useState({
    application_shortlisted: true,
    application_interview: true,
    application_hired: true,
    application_rejected: true,
    new_application_received: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_preferences")
        .select("preferences")
        .eq("user_id", user.id)
        .single();

      if (data?.preferences) {
        setPreferences((prev) => ({
          ...prev,
          ...data.preferences,
        }));
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: user.id,
        preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const preferenceLabels = {
    application_shortlisted: "When I'm shortlisted for a job",
    application_interview: "When I'm invited for an interview",
    application_hired: "When I'm hired",
    application_rejected: "When my application is rejected",
    new_application_received: "When I submit a new application",
  };

  if (loading) {
    return <div className="p-4">Loading preferences...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <Briefcase className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-900">
          Application Notifications
        </h2>
      </div>

      <p className="text-gray-600 mb-6">
        Control when you receive notifications about your job applications.
      </p>

      <div className="space-y-4">
        {Object.entries(preferences).map(([key, value]) => {
          if (
            !key.startsWith("application_") &&
            key !== "new_application_received"
          )
            return null;

          return (
            <div
              key={key}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {preferenceLabels[key] || key.replace("_", " ")}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {key === "application_shortlisted" &&
                    "Get notified when an employer shortlists your application"}
                  {key === "application_interview" &&
                    "Receive interview invitations and schedule updates"}
                  {key === "application_hired" &&
                    "Get the good news when you're hired"}
                  {key === "application_rejected" &&
                    "Be informed about application rejections"}
                  {key === "new_application_received" &&
                    "Confirm when your application is submitted successfully"}
                </p>
              </div>

              <button
                onClick={() => togglePreference(key)}
                className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  value ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    value ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </button>
      </div>
    </div>
  );
}
