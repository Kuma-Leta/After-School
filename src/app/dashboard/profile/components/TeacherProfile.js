// app/dashboard/profile/components/TeacherProfile.js
export default function TeacherProfile({ roleDetails }) {
  if (!roleDetails) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#1F1F1F]">
          Teaching Qualifications
        </h2>
        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
          Professional
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Years of Experience
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.experience_years || 0} years
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Education Level
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.education_level || "Not specified"}
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-500">Subjects</label>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(roleDetails.subject) &&
            roleDetails.subject.length > 0 ? (
              roleDetails.subject.map((subject, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {subject}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No subjects specified</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Grade Levels
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(roleDetails.grade_levels) &&
            roleDetails.grade_levels.length > 0 ? (
              roleDetails.grade_levels.map((level, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
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
            Hourly Rate Range (ETB)
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {Array.isArray(roleDetails.hourly_rate_range)
              ? `ETB ${roleDetails.hourly_rate_range[0]} - ${roleDetails.hourly_rate_range[1]}`
              : "Not specified"}
          </p>
        </div>

        {roleDetails.bio && (
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Professional Bio
            </label>
            <p className="text-lg text-[#1F1F1F] whitespace-pre-wrap">
              {roleDetails.bio}
            </p>
          </div>
        )}

        <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Rating:</span>
              <div className="flex items-center">
                <span className="text-yellow-500">★</span>
                <span className="ml-1 font-medium">
                  {roleDetails.rating || 0}/5
                </span>
                <span className="ml-1 text-sm text-gray-600">
                  ({roleDetails.total_reviews || 0} reviews)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Verification:
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${roleDetails.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
              >
                {roleDetails.is_verified ? "Verified" : "Not Verified"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
