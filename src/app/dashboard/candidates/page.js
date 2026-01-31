// app/dashboard/candidates/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export default function CandidatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicationDetail, setApplicationDetail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadEmployerJobs();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  async function loadEmployerJobs() {
    try {
      setLoading(true);

      const { data: employerJobs, error: jobsError } = await supabase
        .from("jobs")
        .select(
          `
          id, 
          title, 
          job_type, 
          location, 
          subject,
          grade_levels,
          schedule,
          salary_range,
          created_at,
          application_count,
          is_filled
        `,
        )
        .eq("organization_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      const jobsWithApplications = [];

      for (const job of employerJobs) {
        const { data: applications, error: appsError } = await supabase
          .from("applications")
          .select("id, status")
          .eq("job_id", job.id);

        if (!appsError && applications && applications.length > 0) {
          jobsWithApplications.push({
            ...job,
            applications_count: applications.length,
            pending_count: applications.filter(
              (app) => app.status === "pending",
            ).length,
            shortlisted_count: applications.filter(
              (app) => app.status === "shortlisted",
            ).length,
            hired_count: applications.filter((app) => app.status === "hired")
              .length,
          });
        }
      }

      setJobs(jobsWithApplications);

      if (selectedJob) {
        const currentJob = jobsWithApplications.find(
          (j) => j.id === selectedJob.id,
        );
        if (currentJob) {
          await loadJobApplicants(currentJob);
        } else {
          setSelectedJob(null);
          setApplicants([]);
          setActiveTab("jobs");
        }
      }
    } catch (error) {
      console.error("Error loading employer jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadJobApplicants(job) {
    try {
      setSelectedJob(job);
      setLoading(true);

      const { data: applications, error: applicationsError } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", job.id)
        .order("submitted_at", { ascending: false });

      if (applicationsError) throw applicationsError;

      if (!applications || applications.length === 0) {
        setApplicants([]);
        return;
      }

      const applicantIds = applications
        .map((app) => app.applicant_id)
        .filter(Boolean);
      const { data: applicantProfiles, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          id, 
          full_name, 
          phone, 
          role, 
          location, 
          bio,
          date_of_birth,
          gender,
          languages,
          profile_completion
        `,
        )
        .in("id", applicantIds);

      if (profileError) throw profileError;

      const combinedApplicants = applications.map((application) => {
        const profile =
          applicantProfiles?.find((p) => p.id === application.applicant_id) ||
          {};

        let age = null;
        if (profile.date_of_birth) {
          const birthDate = new Date(profile.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
        }

        const languages = profile.languages
          ? Array.isArray(profile.languages)
            ? profile.languages.join(", ")
            : profile.languages
          : "Not specified";

        return {
          application,
          profile: {
            ...profile,
            age,
            languages,
          },
        };
      });

      setApplicants(combinedApplicants);
      setActiveTab("applicants");
    } catch (error) {
      console.error("Error loading job applicants:", error);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadApplicationDetail(applicant) {
    try {
      setLoading(true);

      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicant.application.id)
        .single();

      if (appError) throw appError;

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", application.job_id)
        .single();

      if (jobError) throw jobError;

      setApplicationDetail({
        application,
        applicant: applicant.profile,
        job,
      });

      setSelectedApplicant(applicant);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading application details:", error);
    } finally {
      setLoading(false);
    }
  }

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "reviewed") {
        updateData.reviewed_at = new Date().toISOString();
      } else if (newStatus === "hired") {
        updateData.hired_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) throw error;

      if (selectedJob) {
        await loadJobApplicants(selectedJob);
      } else {
        await loadEmployerJobs();
      }

      if (isModalOpen && applicationDetail) {
        const { data: updatedApp } = await supabase
          .from("applications")
          .select("*")
          .eq("id", applicationId)
          .single();

        if (updatedApp) {
          setApplicationDetail((prev) => ({
            ...prev,
            application: updatedApp,
          }));
        }
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setApplicationDetail(null);
    setSelectedApplicant(null);
  };

  const goBackToJobs = () => {
    setSelectedJob(null);
    setApplicants([]);
    setActiveTab("jobs");
  };

  const goBackToApplicants = () => {
    setActiveTab("applicants");
    setApplicationDetail(null);
    setSelectedApplicant(null);
    setIsModalOpen(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      reviewed: "bg-blue-100 text-blue-800 border border-blue-200",
      shortlisted: "bg-purple-100 text-purple-800 border border-purple-200",
      interviewing: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      hired: "bg-green-100 text-green-800 border border-green-200",
      rejected: "bg-red-100 text-red-800 border border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">
              {activeTab === "jobs" && "Jobs with Applications"}
              {activeTab === "applicants" &&
                `Applicants for "${selectedJob?.title}"`}
              {isModalOpen && "Application Details"}
            </h1>
            <p className="text-gray-600 mt-2">
              {activeTab === "jobs" &&
                "Manage applications for your posted jobs"}
              {activeTab === "applicants" && "Review and manage applicants"}
              {isModalOpen && "View application details and candidate profile"}
            </p>
          </div>

          {/* Breadcrumb navigation */}
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={
                activeTab === "applicants" || isModalOpen
                  ? goBackToJobs
                  : undefined
              }
              className={`${activeTab === "applicants" || isModalOpen ? "text-primary hover:text-primary/90 cursor-pointer" : "text-gray-400 cursor-default"}`}
            >
              Jobs
            </button>
            {activeTab === "applicants" || isModalOpen ? (
              <>
                <span className="text-gray-400">/</span>
                <button
                  onClick={isModalOpen ? goBackToApplicants : undefined}
                  className={`${isModalOpen ? "text-primary hover:text-primary/90 cursor-pointer" : "text-gray-600"}`}
                >
                  {selectedJob?.title?.slice(0, 20)}...
                </button>
              </>
            ) : null}
            {isModalOpen && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">
                  {applicationDetail?.applicant?.full_name?.slice(0, 15)}...
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[600px]">
        {/* Jobs List View */}
        {activeTab === "jobs" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-gray-200 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-white"
                    onClick={() => loadJobApplicants(job)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-secondary line-clamp-2">
                        {job.title}
                      </h3>
                      {job.is_filled && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                          Filled
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
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
                        <span className="font-medium">
                          {job.location || "Remote"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
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
                        <span className="font-medium">
                          {job.schedule || "Flexible schedule"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium">
                          {job.salary_range || "Salary negotiable"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-2xl font-bold text-secondary">
                            {job.applications_count || 0}
                          </div>
                          <div className="text-xs text-gray-700 font-medium">
                            Total Applicants
                          </div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-800">
                            {job.pending_count || 0}
                          </div>
                          <div className="text-xs text-yellow-800 font-medium">
                            Pending Review
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-4 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm">
                      View Applicants
                    </button>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-gray-50 rounded-xl">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
                    <span className="text-gray-400 text-4xl">📭</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary mb-3">
                    No Applications Yet
                  </h3>
                  <p className="text-gray-700 max-w-md mx-auto mb-8">
                    Your posted jobs don't have any applications yet. Share your
                    job posts to attract candidates.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/jobs/post")}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-md"
                  >
                    Create New Job Post
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applicants List View */}
        {activeTab === "applicants" && (
          <div className="p-6">
            {/* Job Summary Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-secondary mb-2">
                    {selectedJob?.title}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-200 text-blue-800 font-medium">
                      <svg
                        className="w-4 h-4 mr-1"
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
                      </svg>
                      {selectedJob?.location || "Remote"}
                    </span>
                    <span className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-200 text-blue-800 font-medium">
                      <svg
                        className="w-4 h-4 mr-1"
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
                      {selectedJob?.schedule || "Flexible"}
                    </span>
                    <span className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-200 text-blue-800 font-medium">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {selectedJob?.salary_range || "Negotiable"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-4 py-3 bg-white rounded-lg border border-gray-300 shadow-sm">
                    <div className="text-2xl font-bold text-secondary">
                      {applicants.length}
                    </div>
                    <div className="text-xs text-gray-700 font-semibold">
                      Total
                    </div>
                  </div>
                  <div className="text-center px-4 py-3 bg-white rounded-lg border border-yellow-300 shadow-sm">
                    <div className="text-2xl font-bold text-yellow-800">
                      {
                        applicants.filter(
                          (a) => a.application.status === "pending",
                        ).length
                      }
                    </div>
                    <div className="text-xs text-yellow-800 font-semibold">
                      Pending
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Applicants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applicants.length > 0 ? (
                applicants.map((applicant, index) => (
                  <div
                    key={applicant.application.id}
                    className="border border-gray-200 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-white"
                    onClick={() => loadApplicationDetail(applicant)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg mr-3 border-2 border-blue-200">
                          {applicant.profile.full_name?.charAt(0) || "A"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-secondary">
                            {applicant.profile.full_name ||
                              "Anonymous Applicant"}
                          </h3>
                          <p className="text-sm text-gray-700 font-medium capitalize">
                            {applicant.profile.role || "Applicant"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getStatusColor(applicant.application.status)}`}
                      >
                        {applicant.application.status.charAt(0).toUpperCase() +
                          applicant.application.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-800">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="font-medium">
                          {applicant.profile.phone || "Phone not provided"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-800">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-600"
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
                        </svg>
                        <span className="font-medium">
                          {applicant.profile.location ||
                            "Location not specified"}
                        </span>
                      </div>
                      {applicant.profile.age && (
                        <div className="flex items-center text-sm text-gray-800">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"
                            />
                          </svg>
                          <span className="font-medium">
                            {applicant.profile.age} years old
                          </span>
                        </div>
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
                          Applied:{" "}
                          {formatDate(applicant.application.submitted_at)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadApplicationDetail(applicant);
                          }}
                          className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
                        >
                          View Details
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-gray-50 rounded-xl">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
                    <span className="text-gray-400 text-4xl">👤</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary mb-3">
                    No Applicants Found
                  </h3>
                  <p className="text-gray-700 max-w-md mx-auto mb-8 font-medium">
                    This job doesn't have any applicants yet. Consider promoting
                    your job post.
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={goBackToJobs}
                      className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold border border-gray-300 shadow-sm"
                    >
                      Back to Jobs
                    </button>
                    <button
                      onClick={() => router.push(`/jobs/${selectedJob?.id}`)}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-md"
                    >
                      View Job Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {isModalOpen && applicationDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={closeModal}
          />

          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-300">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-300 px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-secondary">
                      Application Details
                    </h2>
                    <p className="text-sm text-gray-700 font-medium">
                      {applicationDetail.applicant.full_name} •{" "}
                      {selectedJob?.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(applicationDetail.application.status)}`}
                    >
                      {applicationDetail.application.status
                        .charAt(0)
                        .toUpperCase() +
                        applicationDetail.application.status.slice(1)}
                    </span>
                    <button
                      onClick={closeModal}
                      className="text-gray-500 hover:text-secondary p-1 rounded-full hover:bg-gray-100"
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
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Applicant Profile Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl border-4 border-white shadow-sm">
                      {applicationDetail.applicant.full_name?.charAt(0) || "A"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-secondary mb-2">
                        {applicationDetail.applicant.full_name ||
                          "Anonymous Applicant"}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-700 mb-1 font-semibold">
                            Role
                          </div>
                          <div className="font-semibold text-secondary capitalize">
                            {applicationDetail.applicant.role || "Applicant"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-700 mb-1 font-semibold">
                            Location
                          </div>
                          <div className="font-semibold text-secondary">
                            {applicationDetail.applicant.location ||
                              "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-700 mb-1 font-semibold">
                            Phone
                          </div>
                          <div className="font-semibold text-secondary">
                            {applicationDetail.applicant.phone ||
                              "Not provided"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-700 mb-1 font-semibold">
                            Age
                          </div>
                          <div className="font-semibold text-secondary">
                            {applicationDetail.applicant.age
                              ? `${applicationDetail.applicant.age} years`
                              : "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {applicationDetail.applicant.phone && (
                        <a
                          href={`tel:${applicationDetail.applicant.phone}`}
                          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-semibold shadow-sm"
                        >
                          Call Candidate
                        </a>
                      )}
                      <button
                        onClick={goBackToApplicants}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold shadow-sm"
                      >
                        Back to List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Application Details */}
                  <div className="space-y-6">
                    {/* Cover Letter */}
                    <div>
                      <h3 className="text-lg font-semibold text-secondary mb-3 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Cover Letter
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                        <p className="text-gray-800 whitespace-pre-line font-medium">
                          {applicationDetail.application.cover_letter ||
                            "No cover letter provided."}
                        </p>
                      </div>
                    </div>

                    {/* Application Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-secondary mb-3">
                        Application Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                          <div className="text-sm text-gray-700 mb-1 font-semibold">
                            Applied Date
                          </div>
                          <div className="font-semibold text-secondary">
                            {formatDate(
                              applicationDetail.application.submitted_at,
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                          <div className="text-sm text-gray-700 mb-1 font-semibold">
                            Last Updated
                          </div>
                          <div className="font-semibold text-secondary">
                            {formatDate(
                              applicationDetail.application.updated_at,
                            ) || "Not updated"}
                          </div>
                        </div>
                        {applicationDetail.application.resume_url && (
                          <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-300">
                            <div className="text-sm text-gray-700 mb-1 font-semibold">
                              Resume
                            </div>
                            <a
                              href={applicationDetail.application.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:text-primary/80 font-semibold"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Update Actions */}
                    <div>
                      <h3 className="text-lg font-semibold text-secondary mb-3">
                        Update Application Status
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          "reviewed",
                          "shortlisted",
                          "interviewing",
                          "hired",
                          "rejected",
                        ].map(
                          (status) =>
                            applicationDetail.application.status !== status && (
                              <button
                                key={status}
                                onClick={() =>
                                  updateApplicationStatus(
                                    applicationDetail.application.id,
                                    status,
                                  )
                                }
                                className={`px-3 py-2 rounded-lg text-sm font-semibold shadow-sm ${
                                  status === "hired"
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : status === "rejected"
                                      ? "bg-red-600 text-white hover:bg-red-700"
                                      : status === "interviewing"
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                        : status === "shortlisted"
                                          ? "bg-purple-600 text-white hover:bg-purple-700"
                                          : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                Mark as {status}
                              </button>
                            ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Candidate Profile */}
                  <div className="space-y-6">
                    {/* Candidate Bio */}
                    {applicationDetail.applicant.bio && (
                      <div>
                        <h3 className="text-lg font-semibold text-secondary mb-3">
                          Candidate Bio
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                          <p className="text-gray-800 font-medium">
                            {applicationDetail.applicant.bio}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-secondary mb-3">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {applicationDetail.applicant.gender && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                            <div className="text-sm text-gray-700 mb-1 font-semibold">
                              Gender
                            </div>
                            <div className="font-semibold text-secondary capitalize">
                              {applicationDetail.applicant.gender}
                            </div>
                          </div>
                        )}
                        {applicationDetail.applicant.languages && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                            <div className="text-sm text-gray-700 mb-1 font-semibold">
                              Languages
                            </div>
                            <div className="font-semibold text-secondary">
                              {applicationDetail.applicant.languages}
                            </div>
                          </div>
                        )}
                        {applicationDetail.applicant.profile_completion && (
                          <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-300">
                            <div className="text-sm text-gray-700 mb-1 font-semibold">
                              Profile Completion
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-3">
                              <div
                                className="bg-green-600 h-3 rounded-full"
                                style={{
                                  width: `${applicationDetail.applicant.profile_completion}%`,
                                }}
                              ></div>
                            </div>
                            <div className="text-sm text-gray-800 mt-1 font-semibold">
                              {applicationDetail.applicant.profile_completion}%
                              complete
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Job Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-secondary mb-3">
                        Job Details
                      </h3>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-300">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 font-semibold">
                              Position:
                            </span>
                            <span className="font-semibold text-secondary">
                              {selectedJob?.title}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 font-semibold">
                              Subject:
                            </span>
                            <span className="font-semibold text-secondary">
                              {selectedJob?.subject}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 font-semibold">
                              Location:
                            </span>
                            <span className="font-semibold text-secondary">
                              {selectedJob?.location || "Remote"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 font-semibold">
                              Schedule:
                            </span>
                            <span className="font-semibold text-secondary">
                              {selectedJob?.schedule || "Flexible"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 font-semibold">
                              Salary:
                            </span>
                            <span className="font-semibold text-secondary">
                              {selectedJob?.salary_range || "Negotiable"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-300 px-6 py-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 hover:text-secondary font-semibold"
                  >
                    Close
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/profile/${applicationDetail.applicant.id}`,
                        )
                      }
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold shadow-sm"
                    >
                      View Full Profile
                    </button>
                    <button
                      onClick={() =>
                        updateApplicationStatus(
                          applicationDetail.application.id,
                          applicationDetail.application.status === "hired"
                            ? "shortlisted"
                            : "hired",
                        )
                      }
                      className={`px-6 py-2.5 rounded-lg font-semibold shadow-md ${
                        applicationDetail.application.status === "hired"
                          ? "bg-yellow-600 text-white hover:bg-yellow-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {applicationDetail.application.status === "hired"
                        ? "Unhire"
                        : "Hire Candidate"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
