// components/candidates/JobCard.jsx
import InfoRow from "./InfoRow";
import StatBox from "@/components/common/StatBox";

export default function JobCard({ job, onClick }) {
  return (
    <div
      className="border border-gray-200 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-white"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-secondary line-clamp-2">
          {job.title}
        </h3>
        {job.is_filled && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
            Filled
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <InfoRow icon="location" text={job.location || "Remote"} />
        <InfoRow icon="schedule" text={job.schedule || "Flexible schedule"} />
        <InfoRow icon="salary" text={job.salary_range || "Salary negotiable"} />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <StatBox
            value={job.applications_count || 0}
            label="Total Applicants"
            bgColor="bg-gray-50"
            textColor="text-secondary"
            borderColor="border-gray-200"
          />
          <StatBox
            value={job.pending_count || 0}
            label="Pending Review"
            bgColor="bg-yellow-50"
            textColor="text-yellow-800"
            borderColor="border-yellow-200"
          />
        </div>
      </div>

      <button className="w-full mt-4 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm">
        View Applicants
      </button>
    </div>
  );
}
