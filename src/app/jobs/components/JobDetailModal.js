// app/components/JobDetailModal.js - FIXED
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useTrialStatus } from "@/hooks/useTrialStatus";

// Inside the JobDetailModal component, update the Apply button logic:
export default function JobDetailModal({
  job,
  onClose,
  viewerRole,
  onPremiumActionBlocked,
}) {
  const router = useRouter();
  const { trialStatus } = useTrialStatus();
  const [user, setUser] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [userRole, setUserRole] = useState((viewerRole || "").toLowerCase());
  const [isEntering, setIsEntering] = useState(false);

  // Fix: Add the missing handleBackdropClick function
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const checkUserAndApplication = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authUser.id)
            .maybeSingle();

          if (profile?.role) {
            setUserRole(profile.role.toLowerCase());
          }

          const { data: existingApplication } = await supabase
            .from("applications")
            .select("id")
            .eq("job_id", job.id)
            .eq("applicant_id", authUser.id)
            .single();

          setHasApplied(!!existingApplication);
        }
      } catch (error) {
        console.error("Error checking application:", error);
      }
    };

    checkUserAndApplication();
  }, [job.id]);

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsEntering(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleApply = async () => {
    const normalizedRole = (userRole || viewerRole || "").toLowerCase();
    if (["school", "family", "ngo"].includes(normalizedRole)) {
      return;
    }

    if (!user) {
      router.push(`/login?redirect=/jobs/${job.id}/apply`);
      return;
    }

    if (trialStatus.requiresPayment) {
      onPremiumActionBlocked?.({
        action: "apply_for_job",
        jobId: job.id,
        trigger: "premium_action_blocked",
      });
      router.push(
        `/payment?redirect=${encodeURIComponent(`/jobs/${job.id}/apply`)}`,
      );
      return;
    }

    if (hasApplied) {
      if (
        confirm(
          "You have already applied to this job. Would you like to view your application?",
        )
      ) {
        router.push("/dashboard/applications");
        onClose();
      }
      return;
    }

    // Check if job is still active and not expired
    const daysLeft = Math.ceil(
      (new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (!job.is_active || daysLeft <= 0) {
      alert("This job is no longer accepting applications.");
      return;
    }

    router.push(`/jobs/${job.id}/apply`);
    onClose();
  };

  const daysLeft = job?.application_deadline
    ? Math.ceil(
        (new Date(job.application_deadline) - new Date()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const isHiringPartnerRole = ["school", "family", "ngo"].includes(
    (userRole || viewerRole || "").toLowerCase(),
  );
  const isClosed = daysLeft <= 0 || !job.is_active;
  const showApplyButton = !isHiringPartnerRole && !hasApplied;

  const goToApplications = () => {
    router.push("/dashboard/applications");
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 transition-opacity duration-300 ease-out ${
        isEntering ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick} // Now this function is defined
    >
      <div
        className={`relative w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] transition-all duration-300 ease-out ${
          isEntering
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-[0.985]"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF1E00] via-[#FF6B00] to-[#FFA24A]" />
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-6 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                {job.title}
              </h2>
              <div className="mb-1 flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
                  {job.job_type}
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">
                  {job.subject}
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-800">
                  {job.location || "Location not specified"}
                </span>
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
                  {job.salary_range || "Negotiable"} / month
                </span>
                {hasApplied && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    Applied
                  </span>
                )}
                {job.organizations?.verified && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    Verified Employer
                  </span>
                )}
                {isClosed && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-800">
                    Closed
                  </span>
                )}
                {!isClosed && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      daysLeft <= 3
                        ? "bg-red-100 text-red-800"
                        : daysLeft <= 7
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                  </span>
                )}
                {!isHiringPartnerRole && trialStatus.isTrialActive && (
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lime-800">
                    Trial: {trialStatus.trialDaysLeft}d
                  </span>
                )}
                {!isHiringPartnerRole &&
                  !trialStatus.isTrialActive &&
                  trialStatus.requiresPayment && (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-800">
                      Payment Required
                    </span>
                  )}
                {!isHiringPartnerRole &&
                  !trialStatus.loading &&
                  !trialStatus.requiresPayment && (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
                      Premium Active
                    </span>
                  )}
                {!isHiringPartnerRole && trialStatus.loading && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Checking Access
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-7">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Job Description */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-bold tracking-tight text-slate-900">
                  Job Description
                </h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap leading-7 text-slate-700">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-bold tracking-tight text-slate-900">
                  Requirements & Qualifications
                </h3>
                <ul className="space-y-2">
                  {Array.isArray(job.requirements) &&
                  job.requirements.length > 0 ? (
                    job.requirements.map((req, index) => (
                      <li
                        key={index}
                        className="flex items-start rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                      >
                        <svg
                          className="mr-2 mt-0.5 h-5 w-5 text-emerald-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-slate-700">{req}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-600">
                      No specific requirements listed
                    </li>
                  )}
                </ul>
              </div>

              {/* Responsibilities */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-bold tracking-tight text-slate-900">
                  Key Responsibilities
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="mr-3 mt-2 h-2 w-2 rounded-full bg-[#FF1E00]"></div>
                    <span className="text-slate-700">
                      Deliver high-quality instruction in {job.subject}
                    </span>
                  </li>
                  <li className="flex items-start rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="mr-3 mt-2 h-2 w-2 rounded-full bg-[#FF1E00]"></div>
                    <span className="text-slate-700">
                      Prepare lesson plans and teaching materials
                    </span>
                  </li>
                  <li className="flex items-start rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="mr-3 mt-2 h-2 w-2 rounded-full bg-[#FF1E00]"></div>
                    <span className="text-slate-700">
                      Assess student progress and provide feedback
                    </span>
                  </li>
                  <li className="flex items-start rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="mr-3 mt-2 h-2 w-2 rounded-full bg-[#FF1E00]"></div>
                    <span className="text-slate-700">
                      Participate in staff meetings and professional development
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Job Overview */}
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="mb-4 text-lg font-bold tracking-tight text-slate-900">
                  Job Overview
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600">Posted Date</div>
                    <div className="font-semibold text-slate-900">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">
                      Application Deadline
                    </div>
                    <div
                      className={`font-semibold ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-yellow-600" : "text-green-600"}`}
                    >
                      {new Date(job.application_deadline).toLocaleDateString()}{" "}
                      ({daysLeft} days left)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Job Type</div>
                    <div className="font-semibold text-slate-900">
                      {job.job_type}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Duration</div>
                    <div className="font-semibold text-slate-900">
                      {job.duration || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Schedule</div>
                    <div className="font-semibold text-slate-900">
                      {job.schedule || "Flexible"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Vacancies</div>
                    <div className="font-semibold text-slate-900">
                      {job.vacancies || 1} position
                      {job.vacancies > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Salary</div>
                    <div className="font-semibold text-[#FF1E00]">
                      {job.salary_range || "Negotiable"}
                    </div>
                  </div>
                  {Array.isArray(job.grade_levels) &&
                    job.grade_levels.length > 0 && (
                      <div>
                        <div className="text-sm text-slate-600">
                          Grade Levels
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {job.grade_levels.map((level) => (
                            <span
                              key={level}
                              className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800"
                            >
                              {level}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Employer Info */}
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="mb-4 text-lg font-bold tracking-tight text-slate-900">
                  Employer Information
                </h3>
                <div className="flex items-center mb-4">
                  <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <span className="text-2xl">
                      {job.organizations?.org_type === "school"
                        ? "🏫"
                        : job.organizations?.org_type === "ngo"
                          ? "🤝"
                          : "👨‍👩‍👧"}
                    </span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {job.organizations?.org_name || "Private Employer"}
                    </div>
                    <div className="capitalize text-slate-600">
                      {job.organizations?.org_type || "Organization"}
                    </div>
                    {job.organizations?.verified && (
                      <div className="mt-1 flex items-center text-sm text-emerald-600">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified Employer
                      </div>
                    )}
                  </div>
                </div>
                {job.organizations?.contact_person && (
                  <div className="border-t border-slate-200 pt-4">
                    <div className="text-sm text-slate-600">Contact Person</div>
                    <div className="font-semibold text-slate-900">
                      {job.organizations.contact_person}
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              {!isHiringPartnerRole && (
                <>
                  {showApplyButton ? (
                    <button
                      onClick={handleApply}
                      disabled={isClosed || trialStatus.loading}
                      className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition-colors ${
                        isClosed || trialStatus.loading
                          ? "cursor-not-allowed bg-slate-300 text-slate-500"
                          : "bg-[#FF1E00] hover:bg-[#E01B00]"
                      }`}
                    >
                      {trialStatus.loading
                        ? "Checking..."
                        : isClosed
                          ? "Closed for Applications"
                          : "Apply for this Job"}
                    </button>
                  ) : (
                    <button
                      onClick={goToApplications}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-6 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                    >
                      View Application
                    </button>
                  )}
                  <div className="mt-4 text-center text-sm text-slate-600">
                    {hasApplied
                      ? "You have already applied to this position."
                      : isClosed
                        ? "Application deadline has passed"
                        : `Apply before ${new Date(job.application_deadline).toLocaleDateString()}`}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
