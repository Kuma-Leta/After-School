// /app/dashboard/candidates/components/modal/sections/StatusUpdateSection.jsx
"use client";

import { useState } from "react";
import { ApplicationNotifications } from "@/lib/services/application-notifications";

export default function StatusUpdateSection({
  application,
  getStatusColor,
  formatDate,
  getAvailableStatuses,
  updateApplicationStatus,
  jobTitle,
  organizationName,
  organizationId,
  jobId,
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    // Confirmation logic
    let shouldProceed = true;

    if (newStatus === "rejected") {
      shouldProceed = window.confirm(
        "Are you sure you want to reject this applicant?",
      );
    } else if (newStatus === "hired") {
      shouldProceed = window.confirm(
        "Are you sure you want to hire this applicant?",
      );
    }

    if (!shouldProceed) return;

    setIsUpdating(true);

    try {
      // Get the old status before updating
      const oldStatus = application.status;

      // Update the application status
      await updateApplicationStatus(application.id, newStatus);

      // Send notification to applicant about status change
      const notificationResult =
        await ApplicationNotifications.sendApplicationStatusUpdate({
          applicantId: application.applicant_id,
          applicationId: application.id,
          jobTitle: jobTitle || application.job?.title || "the position",
          organizationName:
            organizationName ||
            application.job?.organization?.name ||
            "the organization",
          oldStatus,
          newStatus,
          jobId: jobId || application.job_id,
          organizationId: organizationId || application.job?.organization_id,
        });

      if (notificationResult.success) {
        // Show success message
        if (typeof window !== "undefined") {
          alert(
            `Status updated to ${newStatus} and notification sent to applicant!`,
          );
        }
      } else {
        console.error("Failed to send notification:", notificationResult.error);
        // Still show success for status update, but log notification failure
        if (typeof window !== "undefined") {
          alert(
            `Status updated to ${newStatus}. Note: Notification could not be sent.`,
          );
        }
      }

      // Optional: If hired, update job as filled
      if (newStatus === "hired" && jobId) {
        await this.markJobAsFilled(jobId, application.applicant_id);
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      if (typeof window !== "undefined") {
        alert("Failed to update application status. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to mark job as filled
  const markJobAsFilled = async (jobId, hiredApplicantId) => {
    try {
      // Update job status in database
      const { supabase } = await import("@/lib/supabase/client");

      const { error } = await supabase
        .from("jobs")
        .update({
          is_filled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) throw error;

      // Get all other applicants for this job
      const { data: applications } = await supabase
        .from("applications")
        .select("applicant_id, status")
        .eq("job_id", jobId)
        .neq("applicant_id", hiredApplicantId);

      if (applications && applications.length > 0) {
        const otherApplicantIds = applications
          .filter(
            (app) => app.status !== "rejected" && app.status !== "withdrawn",
          )
          .map((app) => app.applicant_id);

        if (otherApplicantIds.length > 0) {
          // Send notifications to other applicants
          await ApplicationNotifications.sendJobFilledNotifications({
            applicantIds: otherApplicantIds,
            jobTitle: jobTitle || application.job?.title || "the position",
            organizationName:
              organizationName ||
              application.job?.organization?.name ||
              "the organization",
            jobId,
          });
        }
      }
    } catch (error) {
      console.error("Error marking job as filled:", error);
    }
  };

  const statusLabels = {
    reviewed: "Mark as Reviewed",
    shortlisted: "Shortlist Applicant",
    interviewing: "Schedule Interview",
    hired: "Hire Applicant",
    rejected: "Reject Application",
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-secondary mb-3">
        Update Application Status
      </h3>

      {/* Status History */}
      <div className="mb-4">
        <div className="text-sm text-gray-700 font-medium mb-2">
          Current Status:
        </div>
        <div
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(application.status)}`}
        >
          <span className="mr-2">●</span>
          {application.status.charAt(0).toUpperCase() +
            application.status.slice(1)}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Last updated: {formatDate(application.updated_at)}
        </div>
      </div>

      {/* Available Status Updates */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {getAvailableStatuses(application.status).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusUpdate(status)}
            disabled={isUpdating}
            className={`px-3 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              status === "hired"
                ? "bg-green-600 text-white hover:bg-green-700"
                : status === "rejected"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : status === "interviewing"
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : status === "shortlisted"
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isUpdating ? "Updating..." : statusLabels[status] || status}
          </button>
        ))}
      </div>

      {/* Status Flow Information */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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
            <p className="text-sm text-blue-800 font-medium">
              Status Flow Information
            </p>
            <p className="text-xs text-blue-700">
              Typical flow: Pending → Reviewed → Shortlisted → Interviewing →
              Hired
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Applicants will be notified automatically when status changes.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Preview (Optional) */}
      {isUpdating && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              Sending notification to applicant...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
