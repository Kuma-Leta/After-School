// app/dashboard/candidates/components/ApplicantList/ApplicantCard.js
import { Calendar, MapPin, FileText, Star } from "lucide-react";
import { resolveAvatarSrc } from "@/lib/avatar";

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
  const ratingSummary = applicant?.applicant?.ratingSummary || {
    averageScore: 0,
    reviewCount: 0,
  };
  const avatarSrc = resolveAvatarSrc(applicant?.applicant?.avatarUrl);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start space-x-4 mb-4">
        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
          <div
            role="img"
            aria-label={
              applicant.applicant.fullName || "Default profile avatar"
            }
            className="h-12 w-12 rounded-full bg-center bg-cover"
            style={{ backgroundImage: `url(${avatarSrc})` }}
          />
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
        {ratingSummary.reviewCount > 0 && (
          <div className="flex items-center text-sm text-gray-700">
            <Star className="w-4 h-4 mr-2 text-amber-500" />
            <span className="font-medium">
              {ratingSummary.averageScore.toFixed(1)} / 5
            </span>
            <span className="text-gray-500 ml-2">
              ({ratingSummary.reviewCount} review
              {ratingSummary.reviewCount > 1 ? "s" : ""})
            </span>
          </div>
        )}

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
