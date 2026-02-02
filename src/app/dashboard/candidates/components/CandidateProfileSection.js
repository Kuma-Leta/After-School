// /app/dashboard/candidates/components/modal/sections/CandidateProfileSection.jsx
export default function CandidateProfileSection({ applicant }) {
  return (
    <>
      {/* Candidate Bio */}
      {applicant.bio && (
        <div>
          <h3 className="text-lg font-semibold text-secondary mb-3">
            Candidate Bio
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
            <p className="text-gray-800 font-medium">{applicant.bio}</p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-secondary mb-3">
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {applicant.gender && (
            <InfoBox label="Gender" value={applicant.gender} capitalize />
          )}
          {applicant.languages && (
            <InfoBox label="Languages" value={applicant.languages} />
          )}
          {applicant.profile_completion && (
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-300">
              <div className="text-sm text-gray-700 mb-1 font-semibold">
                Profile Completion
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${applicant.profile_completion}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-800 mt-1 font-semibold">
                {applicant.profile_completion}% complete
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoBox({ label, value, capitalize = false }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
      <div className="text-sm text-gray-700 mb-1 font-semibold">{label}</div>
      <div
        className={`font-semibold text-secondary ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
