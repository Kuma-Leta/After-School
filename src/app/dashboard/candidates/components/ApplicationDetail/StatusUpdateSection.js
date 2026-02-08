// app/dashboard/candidates/components/ApplicationDetail/StatusUpdateSection.js
"use client";

import { useState } from "react";

const STATUS_OPTIONS = {
  pending: ["reviewed", "rejected"],
  reviewed: ["shortlisted", "rejected"],
  shortlisted: ["interviewing", "rejected"],
  interviewing: ["hired", "rejected"],
  hired: [],
  rejected: ["reviewed", "shortlisted"],
};

const STATUS_LABELS = {
  reviewed: "Mark as Reviewed",
  shortlisted: "Shortlist Candidate",
  interviewing: "Schedule Interview",
  hired: "Hire Candidate",
  rejected: "Reject Application",
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  shortlisted: "bg-purple-100 text-purple-800",
  interviewing: "bg-indigo-100 text-indigo-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const BUTTON_COLORS = {
  hired: "bg-green-600 hover:bg-green-700",
  rejected: "bg-red-600 hover:bg-red-700",
  interviewing: "bg-indigo-600 hover:bg-indigo-700",
  shortlisted: "bg-purple-600 hover:bg-purple-700",
  reviewed: "bg-blue-600 hover:bg-blue-700",
};

export default function StatusUpdateSection({
  application,
  job,
  updating,
  error,
  onUpdateStatus,
}) {
  const [selectedStatus, setSelectedStatus] = useState(null);

  const handleStatusUpdate = async (status) => {
    let shouldProceed = true;

    if (status === "rejected") {
      shouldProceed = window.confirm(
        "Are you sure you want to reject this applicant?",
      );
    } else if (status === "hired") {
      shouldProceed = window.confirm(
        "Are you sure you want to hire this applicant? This will mark the job as filled.",
      );
    }

    if (!shouldProceed) return;

    setSelectedStatus(status);
    const result = await onUpdateStatus(status);
    setSelectedStatus(null);

    if (result.success) {
      // Show success message
      alert(`Status updated to ${status}! The applicant has been notified.`);
    }
  };

  const availableStatuses = STATUS_OPTIONS[application.status] || [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Update Application Status
      </h3>

      {/* Current Status */}
      <div className="mb-6">
        <p className="text-sm text-gray-700 font-medium mb-2">Current Status</p>
        <div className="inline-flex items-center space-x-2">
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[application.status]}`}
          >
            {application.status.charAt(0).toUpperCase() +
              application.status.slice(1)}
          </span>
          <span className="text-sm text-gray-500">
            Updated{" "}
            {new Date(
              application.updated_at || application.submittedAt,
            ).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Available Updates */}
      <div>
        <p className="text-sm text-gray-700 font-medium mb-3">
          Available Actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          {availableStatuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusUpdate(status)}
              disabled={updating && selectedStatus === status}
              className={`px-4 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_COLORS[status]}`}
            >
              {updating && selectedStatus === status ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Updating...
                </span>
              ) : (
                STATUS_LABELS[status]
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Status Flow Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start space-x-2">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-700">Status Flow</p>
            <p className="text-xs text-gray-600 mt-1">
              Pending → Reviewed → Shortlisted → Interviewing → Hired
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Applicants are automatically notified when status changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
