// /app/dashboard/candidates/components/modal/sections/JobDetailsSection.jsx
export default function JobDetailsSection({ job }) {
  const details = [
    { label: "Position", value: job?.title },
    { label: "Subject", value: job?.subject },
    { label: "Location", value: job?.location || "Remote" },
    { label: "Schedule", value: job?.schedule || "Flexible" },
    { label: "Salary", value: job?.salary_range || "Negotiable" },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-secondary mb-3">Job Details</h3>
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-300">
        <div className="space-y-2">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-sm text-gray-700 font-semibold">
                {detail.label}:
              </span>
              <span className="font-semibold text-secondary">
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
