"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { isDeadlineExpired } from "@/lib/jobs/deadline";

function formatDate(dateString) {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function JobDetailPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewerRole, setViewerRole] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/jobs/${jobId}`);
    }
  }, [authLoading, jobId, router, user]);

  useEffect(() => {
    if (user?.id && jobId) {
      loadJobDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, jobId]);

  async function loadJobDetail() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = (profileData?.role || "").toLowerCase();
      setViewerRole(role);

      const candidateRemotePreference =
        typeof window !== "undefined" &&
        window.localStorage.getItem("afterschool.jobs.pref.remoteOnly") === "1";

      const response = await fetch(
        `/api/jobs/${jobId}?includeRemotePartTime=true&candidateRemotePreference=${candidateRemotePreference}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load job details");
      }

      setJob(payload?.job || null);

      const { data: existingApplication } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("applicant_id", user.id)
        .maybeSingle();

      setHasApplied(!!existingApplication);
    } catch (error) {
      console.error("Error loading job detail:", error);
      setJob(null);
      setErrorMessage(error?.message || "Unable to load job details.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
        <p className="mt-3 text-gray-600 max-w-md">
          {errorMessage ||
            "This job is unavailable or you do not have access to it."}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00]"
        >
          Go Back
        </button>
      </div>
    );
  }

  const expired = isDeadlineExpired(job.application_deadline);
  const canApply = !expired && job.is_active !== false;
  const isEmployer = ["school", "family", "ngo"].includes(viewerRole || "");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[#FF1E00] hover:underline"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {job.title}
                </h1>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                    {job.job_type || "Part-time"}
                  </span>
                  {job.subject && (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                      {job.subject}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                    {job.location || "Remote"}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                    {job.salary_range || "Negotiable"}
                  </span>
                </div>
              </div>

              <div className="lg:text-right">
                <p className="text-sm text-gray-500">Application deadline</p>
                <p
                  className={`mt-1 text-base font-semibold ${expired ? "text-red-600" : "text-gray-900"}`}
                >
                  {formatDate(job.application_deadline)}
                </p>
                {expired && (
                  <p className="mt-1 text-sm text-red-600">Expired</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Job Description
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-7">
                  {job.description || "No description provided."}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Requirements
                </h2>
                {Array.isArray(job.requirements) &&
                job.requirements.length > 0 ? (
                  <ul className="space-y-3">
                    {job.requirements.map((requirement, index) => (
                      <li
                        key={`${job.id}-req-${index}`}
                        className="flex items-start gap-3 text-gray-700"
                      >
                        <span className="mt-2 h-2 w-2 rounded-full bg-[#FF1E00]" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">
                    No specific requirements listed.
                  </p>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <div className="rounded-xl border border-gray-200 p-5 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Job Overview
                </h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="text-gray-900 text-right">
                      {job.location || "Remote"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Employment</dt>
                    <dd className="text-gray-900 text-right">
                      {job.job_type || "Part-time"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Salary</dt>
                    <dd className="text-gray-900 text-right">
                      {job.salary_range || "Negotiable"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Posted By</dt>
                    <dd className="text-gray-900 text-right">
                      {job.organizations?.org_name || "Private Employer"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Deadline</dt>
                    <dd className="text-gray-900 text-right">
                      {formatDate(job.application_deadline)}
                    </dd>
                  </div>
                </dl>
              </div>

              {!isEmployer && (
                <div className="rounded-xl border border-gray-200 p-5 bg-white">
                  {hasApplied ? (
                    <>
                      <p className="text-sm text-green-700 font-medium">
                        You already applied for this job.
                      </p>
                      <Link
                        href="/dashboard/applications"
                        className="mt-4 inline-flex text-sm text-[#FF1E00] hover:underline"
                      >
                        View my applications
                      </Link>
                    </>
                  ) : canApply ? (
                    <Link
                      href={`/jobs/${job.id}/apply`}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-[#FF1E00] px-4 py-3 text-white font-medium hover:bg-[#E01B00]"
                    >
                      Apply for this job
                    </Link>
                  ) : (
                    <p className="text-sm text-red-600 font-medium">
                      This job is no longer accepting applications.
                    </p>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
