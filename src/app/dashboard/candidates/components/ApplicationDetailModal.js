// /app/dashboard/candidates/components/ApplicationDetailModal.jsx
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  applicationDetail,
  selectedJob,
  getStatusColor,
  formatDate,
  getAvailableStatuses,
  updateApplicationStatus,
  goBackToApplicants,
  router,
}) {
  if (!isOpen || !applicationDetail) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-300">
          <ModalHeader
            title="Application Details"
            subtitle={`${applicationDetail.applicant.full_name} • ${selectedJob?.title}`}
            status={applicationDetail.application.status}
            getStatusColor={getStatusColor}
            onClose={onClose}
          />

          <ModalBody
            applicationDetail={applicationDetail}
            selectedJob={selectedJob}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
            getAvailableStatuses={getAvailableStatuses}
            updateApplicationStatus={updateApplicationStatus}
            goBackToApplicants={goBackToApplicants}
          />

          <ModalFooter
            onClose={onClose}
            applicationDetail={applicationDetail}
            router={router}
            updateApplicationStatus={updateApplicationStatus}
            selectedJob={selectedJob}
          />
        </div>
      </div>
    </div>
  );
}
