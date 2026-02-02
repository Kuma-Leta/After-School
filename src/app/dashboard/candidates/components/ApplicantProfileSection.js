// /app/dashboard/candidates/components/modal/sections/ApplicantProfileSection.jsx
export default function ApplicantProfileSection({
  applicant,
  goBackToApplicants,
}) {
  const initials = applicant.full_name?.charAt(0) || "A";

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl border-4 border-white shadow-sm">
          {initials}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-secondary mb-2">
            {applicant.full_name || "Anonymous Applicant"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem
              label="Role"
              value={applicant.role || "Applicant"}
              capitalize
            />
            <InfoItem
              label="Location"
              value={applicant.location || "Not specified"}
            />
            <InfoItem label="Phone" value={applicant.phone || "Not provided"} />
            <InfoItem
              label="Age"
              value={applicant.age ? `${applicant.age} years` : "Not specified"}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {applicant.phone && (
            <a
              href={`tel:${applicant.phone}`}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-semibold shadow-sm"
            >
              Call Candidate
            </a>
          )}
          <button
            onClick={goBackToApplicants}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold shadow-sm"
          >
            Back to List
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, capitalize = false }) {
  return (
    <div>
      <div className="text-xs text-gray-700 mb-1 font-semibold">{label}</div>
      <div
        className={`font-semibold text-secondary ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
