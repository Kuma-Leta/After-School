// app/dashboard/profile/components/StudentProfile.js
export default function StudentProfile({ roleDetails }) {
  if (!roleDetails) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#1F1F1F]">
          Student Profile
        </h2>
        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
          Tutoring
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            University
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.university || "Not specified"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Department
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.department || "Not specified"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Graduation Year
          </label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.graduation_year || "Not specified"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">GPA</label>
          <p className="text-lg text-[#1F1F1F]">
            {roleDetails.gpa || "Not specified"}
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Skills & Abilities
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(roleDetails.skills) &&
            roleDetails.skills.length > 0 ? (
              roleDetails.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No skills specified</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Subjects You Can Tutor
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(roleDetails.tutoring_subjects) &&
            roleDetails.tutoring_subjects.length > 0 ? (
              roleDetails.tutoring_subjects.map((subject, index) => (
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

          {roleDetails.availability &&
            Object.keys(roleDetails.availability).length > 0 && (
              <div className="text-sm text-gray-600">
                Available for tutoring
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
