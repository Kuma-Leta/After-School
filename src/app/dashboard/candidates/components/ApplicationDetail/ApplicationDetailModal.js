// app/dashboard/candidates/components/ApplicationDetail/ApplicationDetailModal.js
"use client";

import { useEffect } from "react";
import StatusUpdateSection from "./StatusUpdateSection";
import ApplicantInfoSection from "./ApplicantInfoSection";
import PostPlacementReviewSection from "./PostPlacementReviewSection";
import { useApplicationStatus } from "../hooks/useApplicationStatus";

export default function ApplicationDetailModal({
  isOpen,
  application,
  job,
  onClose,
  onStatusUpdate,
  onBackToApplicants,
}) {
  const { updateStatus, updating, error } = useApplicationStatus();

  const statusLabel = application?.status
    ? application.status.charAt(0).toUpperCase() + application.status.slice(1)
    : "Pending";

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !application) return null;

  const handleUpdateStatus = async (newStatus) => {
    const result = await updateStatus({
      applicationId: application.id,
      newStatus,
      applicantId: application.applicant.id,
      jobTitle: job?.title,
      organizationName: job?.organization?.name || "Our organization",
      jobId: job?.id,
      organizationId: job?.organization_id,
    });

    if (result.success) {
      onStatusUpdate();
    }

    return result;
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Application details"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-end justify-center p-2 sm:items-center sm:p-4">
        <div
          className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[95vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 bg-white px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Application Details
                </h2>
                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  {application.applicant.fullName} for {job?.title}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                    {statusLabel}
                  </span>
                  <span className="text-xs text-gray-500 sm:text-sm">
                    Submitted{" "}
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close application details"
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(95vh-170px)] overflow-y-auto">
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
                {/* Left Column: Applicant Info */}
                <div className="space-y-6">
                  <ApplicantInfoSection
                    applicant={application.applicant}
                    application={application}
                    job={job}
                  />
                </div>

                {/* Right Column: Status Update */}
                <div className="space-y-6">
                  <StatusUpdateSection
                    application={application}
                    job={job}
                    updating={updating}
                    error={error}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  <PostPlacementReviewSection application={application} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Application ID:{" "}
                  <span className="font-mono">
                    {application.id.substring(0, 8)}...
                  </span>
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={onBackToApplicants}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Back to Applicants
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
