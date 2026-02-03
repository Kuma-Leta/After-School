// app/components/JobCard.js
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";
import { useTrialStatus } from "@/hooks/useTrialStatus";

export default function JobCard({ job, onClick }) {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { trialStatus, refreshTrialStatus } = useTrialStatus();
  const [applyingJob, setApplyingJob] = useState(null);
  const daysLeft = Math.ceil(
    (new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24),
  );

  const getSalaryText = () => {
    if (!job.salary_range) return "Negotiable";
    return job.salary_range;
  };

  const getDurationIcon = () => {
    if (!job.duration) return "📅";
    if (job.duration.toLowerCase().includes("month")) return "📆";
    if (job.duration.toLowerCase().includes("year")) return "📅";
    if (job.duration.toLowerCase().includes("contract")) return "📝";
    return "📅";
  };

  const handleApply = async () => {
    // Store the job user wants to apply to
    setApplyingJob(job);

    // Check if user is logged in
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/jobs/${job.id}/apply`);
        return;
      }

      // Check trial status if not loading
      if (!trialStatus.loading) {
        if (trialStatus.requiresPayment) {
          // Show payment modal
          setShowPaymentModal(true);
          return;
        }
      }

      // Check if job is still active and not expired
      const daysLeft = Math.ceil(
        (new Date(job.application_deadline) - new Date()) /
          (1000 * 60 * 60 * 24),
      );
      if (!job.is_active || daysLeft <= 0) {
        alert("This job is no longer accepting applications.");
        return;
      }

      // Check if user has already applied
      const { data: existingApplication } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", job.id)
        .eq("applicant_id", user.id)
        .single();

      if (existingApplication) {
        if (
          confirm(
            "You have already applied to this job. Would you like to view your application?",
          )
        ) {
          router.push("/dashboard/applications");
        }
        return;
      }

      // If trial is active or payment made, proceed to application
      router.push(`/jobs/${job.id}/apply`);
    } catch (error) {
      console.error("Error checking application status:", error);
      router.push(`/jobs/${job.id}/apply`);
    }
  };
  const renderTrialStatus = () => {
    if (trialStatus.loading) return null;

    if (trialStatus.isTrialActive) {
      return (
        <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
          Free Trial: {trialStatus.daysLeft} days left
        </div>
      );
    }

    if (trialStatus.requiresPayment) {
      return (
        <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
          Trial Expired
        </div>
      );
    }

    return (
      <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
        Premium Account
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Job Header */}
      {renderTrialStatus()}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3
              onClick={onClick}
              className="text-xl font-bold text-gray-900 hover:text-[#FF1E00] cursor-pointer line-clamp-2"
            >
              {job.title}
            </h3>
            <div className="flex items-center mt-2 space-x-3">
              <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {job.job_type}
              </span>
              <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                {job.subject}
              </span>
              {job.organizations?.verified && (
                <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#FF1E00]">
              {getSalaryText()}
            </div>
            <div className="text-sm text-gray-600">per month</div>
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{job.location || "Location not specified"}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {getDurationIcon()} {job.duration || "Duration not specified"}
            </span>
          </div>

          {Array.isArray(job.grade_levels) && job.grade_levels.length > 0 && (
            <div className="flex items-center text-gray-600">
              <svg
                className="w-5 h-5 mr-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span>{job.grade_levels.join(", ")}</span>
            </div>
          )}

          {/* Organization Info */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <span className="text-lg">
                  {job.organizations?.org_type === "school"
                    ? "🏫"
                    : job.organizations?.org_type === "ngo"
                      ? "🤝"
                      : "👨‍👩‍👧"}
                </span>
              </div>
              <div>
                <div className="font-medium">
                  {job.organizations?.org_name || "Private Employer"}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {job.organizations?.org_type || "Organization"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Posted {formatDate(job.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Job Description Preview */}
        <p className="text-gray-600 line-clamp-3 mb-6">{job.description}</p>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${daysLeft <= 0 ? "bg-red-100 text-red-800" : daysLeft <= 3 ? "bg-red-100 text-red-800" : daysLeft <= 7 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
          >
            ⏳{" "}
            {daysLeft > 0
              ? `Apply in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
              : "Deadline passed"}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClick}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              View Details
            </button>
            <button
              onClick={handleApply}
              disabled={daysLeft <= 0 || !job.is_active}
              className={`px-4 py-2 font-medium rounded-lg ${
                daysLeft <= 0 || !job.is_active
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#FF1E00] text-white hover:bg-[#E01B00]"
              }`}
            >
              {daysLeft <= 0 || !job.is_active ? "Closed" : "Apply Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
