// app/dashboard/candidates/components/ApplicantList/ApplicantCard.js
import { User, Calendar, MapPin, FileText } from "lucide-react";

const getStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewed: "bg-blue-100 text-blue-800",
    shortlisted: "bg-purple-100 text-purple-800",
    interviewing: "bg-indigo-100 text-indigo-800",
    hired: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export default function ApplicantCard({ applicant, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start space-x-4 mb-4">
        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
          {applicant.applicant.avatarUrl ? (
            <img
              src={applicant.applicant.avatarUrl}
              alt={applicant.applicant.fullName}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <User className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {applicant.applicant.fullName}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {applicant.applicant.email}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(applicant.status)}`}
        >
          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>
            {applicant.applicant.location || "Location not specified"}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            Applied {new Date(applicant.submittedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {applicant.coverLetter && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <FileText className="w-4 h-4 mr-2" />
            <span className="font-medium">Cover Letter</span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {applicant.coverLetter.substring(0, 100)}...
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
          View Details →
        </button>
      </div>
    </div>
  );
}
