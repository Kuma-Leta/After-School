// app/dashboard/candidates/components/ApplicationDetail/ApplicantInfoSection.js
"use client";

import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Download,
  Globe,
  UserCircle,
  Star,
} from "lucide-react";

export default function ApplicantInfoSection({ applicant, application, job }) {
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatLanguages = (languages) => {
    if (!languages) return "Not specified";
    if (Array.isArray(languages)) return languages.join(", ");
    return languages;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const age = applicant.dateOfBirth
    ? calculateAge(applicant.dateOfBirth)
    : null;
  const ratingSummary = applicant?.ratingSummary || {
    averageScore: 0,
    reviewCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Applicant Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            {applicant.avatarUrl ? (
              <img
                src={applicant.avatarUrl}
                alt={applicant.fullName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <UserCircle className="h-12 w-12 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              {applicant.fullName}
            </h3>
            <p className="text-gray-600">{applicant.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {applicant.role && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {applicant.role}
                </span>
              )}
              {age && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {age} years old
                </span>
              )}
              {ratingSummary.reviewCount > 0 && (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded inline-flex items-center">
                  <Star className="h-3.5 w-3.5 mr-1" />
                  {ratingSummary.averageScore.toFixed(1)} (
                  {ratingSummary.reviewCount})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-gray-400" />
          Contact Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applicant.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{applicant.phone}</p>
              </div>
            </div>
          )}

          {applicant.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{applicant.location}</p>
              </div>
            </div>
          )}

          {applicant.gender && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium">{applicant.gender}</p>
              </div>
            </div>
          )}

          {applicant.languages && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Languages</p>
                <p className="font-medium">
                  {formatLanguages(applicant.languages)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-gray-400" />
          Application Timeline
        </h4>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="font-medium">
                {formatDate(application.submittedAt)}
              </p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              Initial Application
            </span>
          </div>

          {application.reviewed_at && (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Reviewed</p>
                <p className="font-medium">
                  {formatDate(application.reviewed_at)}
                </p>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                Under Review
              </span>
            </div>
          )}

          {application.hired_at && (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Hired</p>
                <p className="font-medium">
                  {formatDate(application.hired_at)}
                </p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                Hired
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cover Letter */}
      {application.coverLetter && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-400" />
            Cover Letter
          </h4>

          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <p className="text-gray-600 whitespace-pre-wrap">
              {application.coverLetter}
            </p>
          </div>
        </div>
      )}

      {/* Resume */}
      {application.resumeUrl && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Download className="h-5 w-5 mr-2 text-gray-400" />
            Resume
          </h4>

          <a
            href={application.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-5 w-5 mr-2" />
            Download Resume
          </a>

          <p className="text-sm text-gray-500 mt-2">
            Click to view or download the applicant&apos;s resume
          </p>
        </div>
      )}

      {/* About */}
      {applicant.bio && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">About</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 whitespace-pre-wrap">{applicant.bio}</p>
          </div>
        </div>
      )}
    </div>
  );
}
