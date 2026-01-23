// app/dashboard/profile/components/OrganizationProfile.js
export default function OrganizationProfile({ roleDetails, roleType }) {
  if (!roleDetails) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#1F1F1F]">
          {roleType === "school"
            ? "School Information"
            : roleType === "ngo"
              ? "Organization Details"
              : "Family Information"}
        </h2>
        <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
          Employer
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            {roleType === "school"
              ? "School Name"
              : roleType === "ngo"
                ? "Organization Name"
                : "Family Name"}
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.org_name || "Not provided"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Contact Person
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.contact_person || "Not provided"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Contact Position
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.contact_position || "Not provided"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Billing Email
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.billing_email || "Not provided"}
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-500">Address</label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.address || "Not provided"}
          </p>
        </div>

        {roleType === "school" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                School Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(roleDetails.school_levels) &&
                roleDetails.school_levels.length > 0 ? (
                  roleDetails.school_levels.map((level, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {level}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">Not specified</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Student Count
              </label>
              <p className="text-lg text-[#1F1F1F]">
                {roleDetails.student_count || "Not specified"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Established Year
              </label>
              <p className="text-lg text-[#1F1F1F]">
                {roleDetails.established_year || "Not specified"}
              </p>
            </div>
          </>
        )}

        {roleType === "ngo" && roleDetails.focus_areas && (
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Focus Areas
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(roleDetails.focus_areas) &&
              roleDetails.focus_areas.length > 0 ? (
                roleDetails.focus_areas.map((area, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">Not specified</p>
              )}
            </div>
          </div>
        )}

        {roleType === "family" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Number of Children
              </label>
              <p className="text-lg text-[#1F1F1F]">
                {roleDetails.children_count || "Not specified"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Preferred Schedule
              </label>
              <p className="text-lg text-[#1F1F1F]">
                {roleDetails.preferred_schedule || "Not specified"}
              </p>
            </div>

            {Array.isArray(roleDetails.children_ages) &&
              roleDetails.children_ages.length > 0 && (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Children Ages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roleDetails.children_ages.map((age, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {age}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </>
        )}

        {roleDetails.program_description && (
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Program Description
            </label>
            <p className="text-lg text-[#1F1F1F] whitespace-pre-wrap">
              {roleDetails.program_description}
            </p>
          </div>
        )}

        <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              Verification Status:
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${roleDetails.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
            >
              {roleDetails.verified ? "Verified" : "Pending Verification"}
            </span>
          </div>
          {roleDetails.verified && (
            <div className="flex items-center text-green-600">
              <svg
                className="w-5 h-5 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">Verified Organization</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
