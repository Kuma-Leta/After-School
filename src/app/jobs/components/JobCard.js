// app/components/JobCard.js
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useTrialStatus } from "@/hooks/useTrialStatus";

export default function JobCard({
  job,
  onClick,
  viewerRole,
  hasApplied = false,
  onPremiumActionBlocked,
}) {
  const router = useRouter();
  const { trialStatus } = useTrialStatus();
  const isHiringPartnerRole = ["school", "family", "ngo"].includes(
    (viewerRole || "").toLowerCase(),
  );
  const isCandidateRole = ["teacher", "student"].includes(
    (viewerRole || "").toLowerCase(),
  );

  // Guard against missing job prop
  if (!job) {
    console.warn("JobCard rendered without a job prop");
    return null;
  }

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

  // Core apply logic
  const applyToJob = async (skipPaymentCheck = false) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        router.push(`/login?redirect=/jobs/${job.id}/apply`);
        return;
      }

      // Wait for trial status to load
      if (trialStatus.loading) return;

      // Payment check (can be skipped after successful payment)
      if (!skipPaymentCheck && trialStatus.requiresPayment) {
        onPremiumActionBlocked?.({
          action: "apply_for_job",
          jobId: job.id,
          trigger: "premium_action_blocked",
        });
        const returnUrl = `/jobs/${job.id}/apply`;
        router.push(`/payment?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // Check if already applied
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

      // All checks passed - proceed to application form
      router.push(`/jobs/${job.id}/apply`);
    } catch (error) {
      console.error("Error in applyToJob:", error);
      // Fallback: still try to go to application (maybe the check failed but user can still apply)
      router.push(`/jobs/${job.id}/apply`);
    }
  };

  const handleApply = async () => {
    await applyToJob();
  };

  const handleViewDetails = (e) => {
    try {
      if (onClick) {
        onClick(e);
      } else {
        // Fallback: navigate to job details page
        router.push(`/jobs/${job.id}`);
      }
    } catch (error) {
      console.error("Error in handleViewDetails:", error);
      // Optionally show a toast or redirect to a safe page
      router.push(`/jobs/${job.id}`);
    }
  };

  const renderTrialStatus = () => {
    if (trialStatus.loading) return null;

    if (trialStatus.isTrialActive) {
      return (
        <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
          Free Trial: {trialStatus.trialDaysLeft} days left
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

  const showApplyButton = !isHiringPartnerRole && !hasApplied;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:border-slate-300">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF1E00] via-[#FF6B00] to-[#FFA24A]" />
      {renderTrialStatus()}
      <div className="p-6 md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3
              onClick={handleViewDetails}
              className="cursor-pointer text-xl font-extrabold tracking-tight text-slate-900 transition-colors hover:text-[#FF1E00] line-clamp-2"
            >
              {job.title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
                {job.job_type}
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">
                {job.subject}
              </span>
              {hasApplied && isCandidateRole && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Applied
                </span>
              )}
              {job.organizations?.verified && (
                <span className="flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
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
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-[#FF1E00]">
              {getSalaryText()}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              per month
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="mb-5 grid grid-cols-1 gap-3">
          <div className="flex items-center text-slate-700">
            <svg
              className="w-5 h-5 mr-2 text-slate-400"
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

          <div className="flex items-center text-slate-700">
            <svg
              className="w-5 h-5 mr-2 text-slate-400"
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
            <div className="flex items-center text-slate-700">
              <svg
                className="w-5 h-5 mr-2 text-slate-400"
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
          <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                <span className="text-lg">
                  {job.organizations?.org_type === "school"
                    ? "🏫"
                    : job.organizations?.org_type === "ngo"
                      ? "🤝"
                      : "👨‍👩‍👧"}
                </span>
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {job.organizations?.org_name || "Private Employer"}
                </div>
                <div className="text-sm capitalize text-slate-500">
                  {job.organizations?.org_type || "Organization"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">
                Posted {formatDate(job.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Job Description Preview */}
        <p className="mb-6 line-clamp-3 text-sm leading-6 text-slate-600">
          {job.description}
        </p>

        {/* Footer */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div
            className={`inline-flex w-fit rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              daysLeft <= 0
                ? "bg-red-100 text-red-800"
                : daysLeft <= 3
                  ? "bg-red-100 text-red-800"
                  : daysLeft <= 7
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
            }`}
          >
            ⏳{" "}
            {daysLeft > 0
              ? `Apply in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
              : "Deadline passed"}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleViewDetails}
              className="inline-flex h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              View Details
            </button>
            {showApplyButton && (
              <button
                onClick={handleApply}
                disabled={
                  trialStatus.loading || daysLeft <= 0 || !job.is_active
                }
                className={`inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold text-white transition-colors ${
                  trialStatus.loading || daysLeft <= 0 || !job.is_active
                    ? "cursor-not-allowed bg-slate-300 text-slate-500"
                    : "bg-[#FF1E00] text-white hover:bg-[#E01B00]"
                }`}
              >
                {trialStatus.loading
                  ? "Checking..."
                  : daysLeft <= 0 || !job.is_active
                    ? "Closed"
                    : "Apply Now"}
              </button>
            )}
            {!showApplyButton && isCandidateRole && hasApplied && (
              <LinkToApplicationsButton router={router} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function LinkToApplicationsButton({ router }) {
  return (
    <button
      onClick={() => router.push("/dashboard/applications")}
      className="inline-flex h-11 items-center rounded-xl border border-emerald-300 bg-emerald-50 px-5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
    >
      View Application
    </button>
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
