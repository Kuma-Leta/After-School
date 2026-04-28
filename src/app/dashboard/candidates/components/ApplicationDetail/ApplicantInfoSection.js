// app/dashboard/candidates/components/ApplicationDetail/ApplicantInfoSection.js
"use client";

import { useState } from "react";
import { Calendar, Download, FileText, Star } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import CandidateProfileModal from "@/components/profile/CandidateProfileModal";
import { normalizeCandidateCollections } from "@/components/profile/CandidatePortfolioSection";

export default function ApplicantInfoSection({ applicant, application, job }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [candidateRoleDetails, setCandidateRoleDetails] = useState({});

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

  const resumeUrl = application.resumeUrl || application.resume_url || null;
  const ratingSummary = applicant?.ratingSummary || {
    averageScore: 0,
    reviewCount: 0,
  };

  const getRoleTable = (role) => {
    switch ((role || "").toLowerCase()) {
      case "teacher":
        return "teacher_profiles";
      case "student":
        return "student_profiles";
      default:
        return null;
    }
  };

  const handleViewProfile = async () => {
    if (!applicant?.id) {
      setProfileError("Candidate profile could not be loaded.");
      setIsProfileModalOpen(true);
      return;
    }

    setIsProfileModalOpen(true);
    setLoadingProfile(true);
    setProfileError("");

    try {
      const { data: profileData, error: profileLoadError } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, phone, role, location, bio, avatar_url, date_of_birth, gender, languages",
        )
        .eq("id", applicant.id)
        .maybeSingle();

      if (profileLoadError) throw profileLoadError;

      const resolvedProfile = profileData || {
        id: applicant.id,
        email: applicant.email,
        full_name: applicant.fullName,
        phone: applicant.phone,
        role: applicant.role,
        location: applicant.location,
        bio: applicant.bio,
        avatar_url: applicant.avatarUrl,
        date_of_birth: applicant.dateOfBirth,
        gender: applicant.gender,
        languages: applicant.languages,
      };

      const roleTable = getRoleTable(resolvedProfile.role || applicant.role);
      let roleData = {};

      if (roleTable) {
        const { data: roleDetailsData, error: roleLoadError } = await supabase
          .from(roleTable)
          .select("*")
          .or(`id.eq.${applicant.id},user_id.eq.${applicant.id}`)
          .maybeSingle();

        if (roleLoadError && roleLoadError.code !== "PGRST116") {
          throw roleLoadError;
        }

        roleData = roleDetailsData || {};
      }

      setCandidateProfile(resolvedProfile);
      setCandidateRoleDetails(normalizeCandidateCollections(roleData));
    } catch (error) {
      setProfileError(error?.message || "Failed to load candidate profile.");
      setCandidateProfile(null);
      setCandidateRoleDetails({});
    } finally {
      setLoadingProfile(false);
    }
  };

  const serviceAvailability =
    applicant?.serviceAvailability || applicant?.weeklyAvailability || [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              Candidate Profile
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              View all candidate profile details in a dedicated reusable profile
              component.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {applicant?.role && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded capitalize">
                  {applicant.role}
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
          <button
            type="button"
            onClick={handleViewProfile}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
          >
            View Profile
          </button>
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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Download className="h-5 w-5 mr-2 text-gray-400" />
          CV / Resume
        </h4>

        {resumeUrl ? (
          <>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              View CV
            </a>

            <p className="text-sm text-gray-500 mt-2">
              Opens the applicant&apos;s CV in a new tab.
            </p>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            No CV was attached to this application.
          </div>
        )}
      </div>

      <CandidateProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        loading={loadingProfile}
        error={profileError}
        profile={candidateProfile}
        roleDetails={candidateRoleDetails}
        ratingSummary={ratingSummary}
        serviceAvailability={serviceAvailability}
      />
    </div>
  );
}
