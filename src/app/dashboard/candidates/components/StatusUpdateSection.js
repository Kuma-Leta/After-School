// /app/dashboard/candidates/components/modal/sections/StatusUpdateSection.jsx
export default function StatusUpdateSection({
  application,
  getStatusColor,
  formatDate,
  getAvailableStatuses,
  updateApplicationStatus,
}) {
  const handleStatusUpdate = (status) => {
    if (status === "rejected") {
      if (window.confirm("Are you sure you want to reject this applicant?")) {
        updateApplicationStatus(application.id, status);
      }
    } else if (status === "hired") {
      if (window.confirm("Are you sure you want to hire this applicant?")) {
        updateApplicationStatus(application.id, status);
      }
    } else {
      updateApplicationStatus(application.id, status);
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
            className={`px-3 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all hover:scale-105 ${
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
            {statusLabels[status] || status}
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
          </div>
        </div>
      </div>
    </div>
  );
}
