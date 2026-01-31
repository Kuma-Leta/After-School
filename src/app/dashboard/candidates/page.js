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
  const [activeTab, setActiveTab] = useState("jobs"); // 'jobs', 'applicants', 'detail'
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

  // Load all jobs posted by the employer that have applications
  async function loadEmployerJobs() {
    try {
      setLoading(true);

      // First, get all jobs posted by this employer
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

      // For each job, check if it has applications
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

      // If there's a selected job, reload its applicants
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

  // Load applicants for a specific job
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

      // Get applicant profiles
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

      // Combine application data with profile data
      const combinedApplicants = applications.map((application) => {
        const profile =
          applicantProfiles?.find((p) => p.id === application.applicant_id) ||
          {};

        // Calculate age from date_of_birth
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

        // Format languages
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

  // Load application details and open modal
  async function loadApplicationDetail(applicant) {
    try {
      setLoading(true);

      // Get the full application details
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicant.application.id)
        .single();

      if (appError) throw appError;

      // Get job details
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

  // Update application status
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

      // Refresh data
      if (selectedJob) {
        await loadJobApplicants(selectedJob);
      } else {
        await loadEmployerJobs();
      }

      // If modal is open, refresh application detail
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

  // Close modal and go back to applicants list
  const closeModal = () => {
    setIsModalOpen(false);
    setApplicationDetail(null);
    setSelectedApplicant(null);
  };

  // Go back to jobs list
  const goBackToJobs = () => {
    setSelectedJob(null);
    setApplicants([]);
    setActiveTab("jobs");
  };

  // Go back to applicants list
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00] mb-4"></div>
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
            <h1 className="text-3xl font-bold text-[#1F1F1F]">
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
              className={`${activeTab === "applicants" || isModalOpen ? "text-[#FF1E00] hover:text-[#E01B00] cursor-pointer" : "text-gray-400 cursor-default"}`}
            >
              Jobs
            </button>
            {activeTab === "applicants" || isModalOpen ? (
              <>
                <span className="text-gray-400">/</span>
                <button
                  onClick={isModalOpen ? goBackToApplicants : undefined}
                  className={`${isModalOpen ? "text-[#FF1E00] hover:text-[#E01B00] cursor-pointer" : "text-gray-600"}`}
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
                    className="border border-gray-200 rounded-xl p-6 hover:border-[#FF1E00] hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => loadJobApplicants(job)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {job.title}
                      </h3>
                      {job.is_filled && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Filled
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{job.location || "Remote"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{job.schedule || "Flexible schedule"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{job.salary_range || "Salary negotiable"}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {job.applications_count || 0}
                          </div>
                          <div className="text-xs text-gray-600">
                            Total Applicants
                          </div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-700">
                            {job.pending_count || 0}
                          </div>
                          <div className="text-xs text-yellow-600">
                            Pending Review
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-4 px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors text-sm font-medium">
                      View Applicants
                    </button>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-gray-400 text-4xl">📭</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No Applications Yet
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    Your posted jobs don&apos;t have any applications yet. Share
                    your job posts to attract candidates.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/jobs/post")}
                    className="px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium"
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
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedJob?.title}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
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
                    <span className="flex items-center">
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
                    <span className="flex items-center">
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
                  <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">
                      {applicants.length}
                    </div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-white rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">
                      {
                        applicants.filter(
                          (a) => a.application.status === "pending",
                        ).length
                      }
                    </div>
                    <div className="text-xs text-yellow-600">Pending</div>
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
                    className="border border-gray-200 rounded-xl p-6 hover:border-[#FF1E00] hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => loadApplicationDetail(applicant)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg mr-3">
                          {applicant.profile.full_name?.charAt(0) || "A"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {applicant.profile.full_name ||
                              "Anonymous Applicant"}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {applicant.profile.role || "Applicant"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusColor(applicant.application.status)}`}
                      >
                        {applicant.application.status.charAt(0).toUpperCase() +
                          applicant.application.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>
                          {applicant.profile.phone || "Phone not provided"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                        <span>
                          {applicant.profile.location ||
                            "Location not specified"}
                        </span>
                      </div>
                      {applicant.profile.age && (
                        <div className="flex items-center text-sm text-gray-600">
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
                              d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"
                            />
                          </svg>
                          <span>{applicant.profile.age} years old</span>
                        </div>
                      )}
                    </div>

                    {applicant.profile.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {applicant.profile.bio}
                      </p>
                    )}

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-sm">
                        <div className="text-gray-600">
                          Applied:{" "}
                          {formatDate(applicant.application.submitted_at)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadApplicationDetail(applicant);
                          }}
                          className="text-[#FF1E00] hover:text-[#E01B00] font-medium"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-gray-400 text-4xl">👤</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No Applicants Found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    This job doesn&apos;t have any applicants yet. Consider
                    promoting your job post.
                  </p>
                  <button
                    onClick={goBackToJobs}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium mr-4"
                  >
                    Back to Jobs
                  </button>
                  <button
                    onClick={() => router.push(`/jobs/${selectedJob?.id}`)}
                    className="px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium"
                  >
                    View Job Post
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {isModalOpen && applicationDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Application Details
                    </h2>
                    <p className="text-sm text-gray-600">
                      {applicationDetail.applicant.full_name} •{" "}
                      {selectedJob?.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(applicationDetail.application.status)}`}
                    >
                      {applicationDetail.application.status
                        .charAt(0)
                        .toUpperCase() +
                        applicationDetail.application.status.slice(1)}
                    </span>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-500"
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-2xl">
                      {applicationDetail.applicant.full_name?.charAt(0) || "A"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {applicationDetail.applicant.full_name ||
                          "Anonymous Applicant"}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Role</div>
                          <div className="font-medium capitalize">
                            {applicationDetail.applicant.role || "Applicant"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">
                            Location
                          </div>
                          <div className="font-medium">
                            {applicationDetail.applicant.location ||
                              "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">
                            Phone
                          </div>
                          <div className="font-medium">
                            {applicationDetail.applicant.phone ||
                              "Not provided"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Age</div>
                          <div className="font-medium">
                            {applicationDetail.applicant.age
                              ? `${applicationDetail.applicant.age} years`
                              : "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`tel:${applicationDetail.applicant.phone}`}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-center font-medium"
                      >
                        Call Candidate
                      </a>
                      <button
                        onClick={goBackToApplicants}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-[#FF1E00]"
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
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-line">
                          {applicationDetail.application.cover_letter ||
                            "No cover letter provided."}
                        </p>
                      </div>
                    </div>

                    {/* Application Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Application Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">
                            Applied Date
                          </div>
                          <div className="font-medium">
                            {formatDate(
                              applicationDetail.application.submitted_at,
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">
                            Last Updated
                          </div>
                          <div className="font-medium">
                            {formatDate(
                              applicationDetail.application.updated_at,
                            ) || "Not updated"}
                          </div>
                        </div>
                        {applicationDetail.application.resume_url && (
                          <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">
                              Resume
                            </div>
                            <a
                              href={applicationDetail.application.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-[#FF1E00] hover:text-[#E01B00] font-medium"
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
                                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                  status === "hired"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                                      : status === "interviewing"
                                        ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                                        : status === "shortlisted"
                                          ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Candidate Bio
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-gray-700">
                            {applicationDetail.applicant.bio}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {applicationDetail.applicant.gender && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">
                              Gender
                            </div>
                            <div className="font-medium capitalize">
                              {applicationDetail.applicant.gender}
                            </div>
                          </div>
                        )}
                        {applicationDetail.applicant.languages && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">
                              Languages
                            </div>
                            <div className="font-medium">
                              {applicationDetail.applicant.languages}
                            </div>
                          </div>
                        )}
                        {applicationDetail.applicant.profile_completion && (
                          <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">
                              Profile Completion
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-green-600 h-2.5 rounded-full"
                                style={{
                                  width: `${applicationDetail.applicant.profile_completion}%`,
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {applicationDetail.applicant.profile_completion}%
                              complete
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Job Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Job Details
                      </h3>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Position:
                            </span>
                            <span className="font-medium">
                              {selectedJob?.title}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Subject:
                            </span>
                            <span className="font-medium">
                              {selectedJob?.subject}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Location:
                            </span>
                            <span className="font-medium">
                              {selectedJob?.location || "Remote"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Schedule:
                            </span>
                            <span className="font-medium">
                              {selectedJob?.schedule || "Flexible"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Salary:
                            </span>
                            <span className="font-medium">
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
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
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
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
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
                      className={`px-6 py-2 rounded-lg font-medium ${
                        applicationDetail.application.status === "hired"
                          ? "bg-yellow-500 text-white hover:bg-yellow-600"
                          : "bg-green-500 text-white hover:bg-green-600"
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
