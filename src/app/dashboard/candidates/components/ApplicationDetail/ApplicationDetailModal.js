// app/dashboard/candidates/components/ApplicationDetail/ApplicationDetailModal.js
"use client";

import { useEffect } from "react";
import StatusUpdateSection from "./StatusUpdateSection";
import ApplicantInfoSection from "./ApplicantInfoSection";
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Application Details
                </h2>
                <p className="text-gray-600">
                  {application.applicant.fullName} • {job?.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
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
          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Application ID:{" "}
                  <span className="font-mono">
                    {application.id.substring(0, 8)}...
                  </span>
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onBackToApplicants}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back to Applicants
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
