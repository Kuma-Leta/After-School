"use client";

import CandidateProfileView from "./CandidateProfileView";

export default function CandidateProfileModal({
  isOpen,
  onClose,
  loading,
  error,
  profile,
  roleDetails,
  ratingSummary,
  serviceAvailability,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Candidate profile"
    >
      <div
        className="fixed inset-0 bg-black/55 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-end justify-center p-2 sm:items-center sm:p-4">
        <div
          className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[95vh]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-gray-200 bg-white px-5 py-4 sm:px-6 sm:py-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Candidate Profile
              </h2>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">
                Detailed candidate information in a dedicated reusable view.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close candidate profile"
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

          <div className="max-h-[calc(95vh-160px)] overflow-y-auto bg-gray-50 p-5 sm:p-6">
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
                Loading candidate profile...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
                {error}
              </div>
            ) : (
              <CandidateProfileView
                profile={profile}
                roleDetails={roleDetails}
                ratingSummary={ratingSummary}
                serviceAvailability={serviceAvailability}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
