// components/candidates/ApplicantCard.jsx
import Avatar from "@/components/common/Avatar";
import StatusBadge from "./StatusBadge";
import InfoRow from "./InfoRow";
import { ArrowRightIcon } from "lucide-react";
export default function ApplicantCard({
  applicant,
  onClick,
  getStatusColor,
  formatDate,
}) {
  const initials = applicant.profile.full_name?.charAt(0) || "A";

  return (
    <div
      className="border border-gray-200 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-white"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Avatar initials={initials} />
          <div>
            <h3 className="font-semibold text-secondary">
              {applicant.profile.full_name || "Anonymous Applicant"}
            </h3>
            <p className="text-sm text-gray-700 font-medium capitalize">
              {applicant.profile.role || "Applicant"}
            </p>
          </div>
        </div>
        <StatusBadge
          status={applicant.application.status}
          getStatusColor={getStatusColor}
        />
      </div>

      <div className="space-y-3 mb-4">
        <InfoRow
          icon="phone"
          text={applicant.profile.phone || "Phone not provided"}
        />
        <InfoRow
          icon="location"
          text={applicant.profile.location || "Location not specified"}
        />
        {applicant.profile.age && (
          <InfoRow icon="age" text={`${applicant.profile.age} years old`} />
        )}
      </div>

      {applicant.profile.bio && (
        <p className="text-sm text-gray-700 mb-4 line-clamp-2 font-medium">
          {applicant.profile.bio}
        </p>
      )}

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-700 font-medium">
            Applied: {formatDate(applicant.application.submitted_at)}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
          >
            View Details
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
