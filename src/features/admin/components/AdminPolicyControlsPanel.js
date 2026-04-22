"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_CONTROLS = {
  allowCrossCityBrowsing: false,
  allowCandidateInitiatedEmployerMessages: false,
  subscriptionRequiredForEmployerContact: true,
};

const TOGGLES = [
  {
    key: "allowCrossCityBrowsing",
    title: "Allow cross-city browsing",
    description:
      "When enabled, teacher and student users can browse jobs outside their own city.",
  },
  {
    key: "allowCandidateInitiatedEmployerMessages",
    title: "Allow candidate-initiated employer messages",
    description:
      "When enabled, candidates can start new direct conversations with employers.",
  },
  {
    key: "subscriptionRequiredForEmployerContact",
    title: "Subscription required for employer contact",
    description:
      "When enabled, employers can only contact candidates with an active subscription.",
  },
];

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      <div className="relative mt-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-[#FF1E00]" />
        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
      </div>
    </label>
  );
}

export default function AdminPolicyControlsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [controls, setControls] = useState(DEFAULT_CONTROLS);

  const loadControls = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/policy-controls", {
        method: "GET",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to load policy controls.");
      }

      setControls({
        allowCrossCityBrowsing: Boolean(
          result?.controls?.allowCrossCityBrowsing,
        ),
        allowCandidateInitiatedEmployerMessages: Boolean(
          result?.controls?.allowCandidateInitiatedEmployerMessages,
        ),
        subscriptionRequiredForEmployerContact:
          result?.controls?.subscriptionRequiredForEmployerContact !== false,
      });
    } catch (loadError) {
      setError(loadError.message || "Failed to load policy controls.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadControls();
  }, [loadControls]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/policy-controls", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(controls),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to update policy controls.");
      }

      setControls({
        allowCrossCityBrowsing: Boolean(
          result?.controls?.allowCrossCityBrowsing,
        ),
        allowCandidateInitiatedEmployerMessages: Boolean(
          result?.controls?.allowCandidateInitiatedEmployerMessages,
        ),
        subscriptionRequiredForEmployerContact:
          result?.controls?.subscriptionRequiredForEmployerContact !== false,
      });
      setSuccess("Policy controls updated.");
    } catch (saveError) {
      setError(saveError.message || "Failed to update policy controls.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
        Loading policy controls...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Policy Controls</h2>
        <p className="mt-1 text-gray-600">
          Toggle platform-wide policy behavior without code changes.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-3">
        {TOGGLES.map((toggle) => (
          <ToggleRow
            key={toggle.key}
            title={toggle.title}
            description={toggle.description}
            checked={Boolean(controls[toggle.key])}
            onChange={(value) =>
              setControls((previous) => ({ ...previous, [toggle.key]: value }))
            }
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#FF1E00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E01B00] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save policy controls"}
        </button>
        <button
          type="button"
          onClick={loadControls}
          disabled={saving}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Reset changes
        </button>
      </div>
    </section>
  );
}
