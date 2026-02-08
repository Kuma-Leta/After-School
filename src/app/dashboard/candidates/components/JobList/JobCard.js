// app/dashboard/candidates/components/JobList/JobCard.js
import { Calendar, MapPin, Users, Briefcase } from "lucide-react";

export default function JobCard({ job, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-600">
            {job.subject} • {job.job_type}
          </p>
        </div>
        {job.is_filled && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
            Filled
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Briefcase className="w-4 h-4 mr-2" />
          <span>{job.schedule}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{new Date(job.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600">
              {job.application_count} application
              {job.application_count !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
            View Applicants →
          </span>
        </div>
      </div>
    </div>
  );
}
