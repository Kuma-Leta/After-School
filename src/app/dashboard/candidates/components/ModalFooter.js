// /app/dashboard/candidates/components/modal/ModalFooter.jsx
export default function ModalFooter({
  onClose,
  applicationDetail,
  router,
  updateApplicationStatus,
  selectedJob,
}) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-300 px-6 py-4 shadow-sm">
      <div className="flex justify-between items-center">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-secondary font-semibold"
        >
          Close
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() =>
              router.push(
                `/dashboard/profile/${applicationDetail.applicant.id}`,
              )
            }
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold shadow-sm"
          >
            View Full Profile
          </button>
          <button
            onClick={() =>
              updateApplicationStatus(
                applicationDetail.application.id,
                applicationDetail.application.status === "hired"
                  ? "shortlisted"
                  : "hired",
              )
            }
            className={`px-6 py-2.5 rounded-lg font-semibold shadow-md ${
              applicationDetail.application.status === "hired"
                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {applicationDetail.application.status === "hired"
              ? "Unhire"
              : "Hire Candidate"}
          </button>
        </div>
      </div>
    </div>
  );
}
