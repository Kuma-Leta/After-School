// /app/dashboard/candidates/components/modal/ModalBody.jsx
import ApplicantProfileSection from "./ApplicantProfileSection";
import CoverLetterSection from "./CoverLetterSection";
import ApplicationInfoSection from "./ApplicationInfoSection";
import StatusUpdateSection from "./StatusUpdateSection";
import CandidateProfileSection from "./CandidateProfileSection";
import JobDetailsSection from "./JobDetailsSection";

export default function ModalBody({
  applicationDetail,
  selectedJob,
  getStatusColor,
  formatDate,
  getAvailableStatuses,
  updateApplicationStatus,
  goBackToApplicants,
}) {
  return (
    <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
      {/* Applicant Profile Section */}
      <ApplicantProfileSection
        applicant={applicationDetail.applicant}
        goBackToApplicants={goBackToApplicants}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Application Details */}
        <div className="space-y-6">
          <CoverLetterSection
            coverLetter={applicationDetail.application.cover_letter}
          />
          <ApplicationInfoSection
            application={applicationDetail.application}
            formatDate={formatDate}
          />

          <StatusUpdateSection
            application={applicationDetail.application}
            applicant={applicationDetail.applicant}
            job={applicationDetail.job}
            organization={organization || applicationDetail.organization}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
            getAvailableStatuses={getAvailableStatuses}
            updateApplicationStatus={updateApplicationStatus}
          />
        </div>

        {/* Right Column - Candidate Profile */}
        <div className="space-y-6">
          <CandidateProfileSection applicant={applicationDetail.applicant} />

          <JobDetailsSection job={selectedJob} />
        </div>
      </div>
    </div>
  );
}
