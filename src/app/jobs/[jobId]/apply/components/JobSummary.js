// app/jobs/[jobId]/apply/components/JobSummary.js
export default function JobSummary({ job }) {
  const daysLeft = job?.application_deadline
    ? Math.ceil(
        (new Date(job.application_deadline) - new Date()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Job Summary</h2>

      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Position</div>
          <div className="font-medium text-gray-900">{job?.title}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Job Type</div>
          <div className="font-medium text-gray-900">{job?.job_type}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Subject</div>
          <div className="font-medium text-gray-900">{job?.subject}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Location</div>
          <div className="font-medium text-gray-900">{job?.location}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Salary Range</div>
          <div className="font-medium text-[#FF1E00]">
            {job?.salary_range || "Negotiable"}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Application Deadline</div>
          <div
            className={`font-medium ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-yellow-600" : "text-green-600"}`}
          >
            {job?.application_deadline
              ? new Date(job.application_deadline).toLocaleDateString()
              : "Not specified"}
            {daysLeft > 0 && ` (${daysLeft} days left)`}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Start Date</div>
          <div className="font-medium text-gray-900">
            {job?.start_date
              ? new Date(job.start_date).toLocaleDateString()
              : "To be discussed"}
          </div>
        </div>

        {job?.grade_levels &&
          Array.isArray(job.grade_levels) &&
          job.grade_levels.length > 0 && (
            <div>
              <div className="text-sm text-gray-500">Grade Levels</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {job.grade_levels.map((level, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>
          )}

        {job?.duration && (
          <div>
            <div className="text-sm text-gray-500">Duration</div>
            <div className="font-medium text-gray-900">{job.duration}</div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Requirements
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {Array.isArray(job?.requirements) && job.requirements.length > 0 ? (
              job.requirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{req}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No specific requirements listed</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
