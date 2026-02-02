// components/candidates/JobSummaryBanner.jsx
import PillBadge from "@/components/common/PillBadge";
import StatBox from "@/components/common/StatBox";

export default function JobSummaryBanner({ job, applicants }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-secondary mb-2">
            {job?.title}
          </h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <PillBadge icon="location" text={job?.location || "Remote"} />
            <PillBadge icon="schedule" text={job?.schedule || "Flexible"} />
            <PillBadge icon="salary" text={job?.salary_range || "Negotiable"} />
          </div>
        </div>
        <div className="flex gap-4">
          <StatBox
            value={applicants.length}
            label="Total"
            bgColor="bg-white"
            textColor="text-secondary"
            borderColor="border-gray-300"
          />
          <StatBox
            value={
              applicants.filter((a) => a.application.status === "pending")
                .length
            }
            label="Pending"
            bgColor="bg-white"
            textColor="text-yellow-800"
            borderColor="border-yellow-300"
          />
        </div>
      </div>
    </div>
  );
}
