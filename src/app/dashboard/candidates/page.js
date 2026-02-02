// app/dashboard/candidates/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import LoadingSpinner from "./components/LoadingSpinner";
import DashboardHeader from "./components/Header";
import JobCard from "./components/JobCard";
import ApplicantCard from "./components/ApplicantCard";
import JobSummaryBanner from "./components/JobSummaryBanner";
import ApplicationDetailModal from "./components/ApplicationDetailModal";
import { NoJobsState, NoApplicantsState } from "./components/EmptyState";

export default function CandidatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicationDetail, setApplicationDetail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadEmployerJobs();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Helper functions
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

  const getAvailableStatuses = (currentStatus) => {
    const allStatuses = [
      "pending",
      "reviewed",
      "shortlisted",
      "interviewing",
      "hired",
      "rejected",
    ];

    // Remove current status
    const available = allStatuses.filter((status) => status !== currentStatus);

    // If already hired or rejected, limit options
    if (currentStatus === "hired") {
      return available.filter(
        (status) => status === "rejected" || status === "shortlisted",
      );
    }

    if (currentStatus === "rejected") {
      return available.filter(
        (status) => status === "reviewed" || status === "shortlisted",
      );
    }

    return available;
  };

  // Data fetching functions
  async function loadEmployerJobs() {
    try {
      setLoading(true);

      // Fetch jobs AND their related application statuses in one go
      const { data: employerJobs, error: jobsError } = await supabase
        .from("jobs")
        .select(
          `
        id, title, job_type, location, subject, 
        grade_levels, schedule, salary_range, 
        created_at, is_filled,
        applications ( status )
      `,
        )
        .eq("organization_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      const jobsWithCounts = employerJobs.map((job) => {
        const apps = job.applications || [];
        return {
          ...job,
          applications_count: apps.length,
          pending_count: apps.filter((a) => a.status === "pending").length,
          shortlisted_count: apps.filter((a) => a.status === "shortlisted")
            .length,
          hired_count: apps.filter((a) => a.status === "hired").length,
        };
      });

      setJobs(jobsWithCounts);

      // Sync selected job if we are currently looking at one
      if (selectedJob) {
        const currentJob = jobsWithCounts.find((j) => j.id === selectedJob.id);
        if (currentJob) {
          setSelectedJob(currentJob);
        }
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
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

      // 1. Optimistic UI Update: Update the local applicants list immediately
      setApplicants((prevApplicants) =>
        prevApplicants.map((item) =>
          item.application.id === applicationId
            ? {
                ...item,
                application: { ...item.application, status: newStatus },
              }
            : item,
        ),
      );

      // 2. Perform the actual database update
      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) throw error;

      // 3. Update Modal state if it's open
      if (isModalOpen && applicationDetail) {
        setApplicationDetail((prev) => ({
          ...prev,
          application: {
            ...prev.application,
            ...updateData,
          },
        }));
      }

      // 4. Refresh background data to ensure counts (Pending/Hired) are accurate
      await Promise.all([
        loadEmployerJobs(), // Updates the main dashboard counts
        selectedJob ? loadJobApplicants(selectedJob) : Promise.resolve(), // Updates the current list
      ]);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Update failed. Please try again.");
      // Rollback: refresh data to restore original state on error
      refreshData();
    }
  };

  // Helper function to refresh data
  const refreshData = async () => {
    if (selectedJob) {
      await loadJobApplicants(selectedJob);
    } else {
      await loadEmployerJobs();
    }

    // Refresh modal data if open
    if (isModalOpen && applicationDetail) {
      const { data: updatedApp } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationDetail.application.id)
        .single();

      if (updatedApp) {
        setApplicationDetail((prev) => ({
          ...prev,
          application: updatedApp,
        }));
      }
    }
  };

  // Navigation functions
  const closeModal = () => {
    setIsModalOpen(false);
    setApplicationDetail(null);
  };

  const goBackToJobs = () => {
    setSelectedJob(null);
    setApplicants([]);
    setActiveTab("jobs");
  };

  const goBackToApplicants = () => {
    setActiveTab("applicants");
    setApplicationDetail(null);
    setIsModalOpen(false);
  };

  // Breadcrumb configuration
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      {
        label: "Jobs",
        onClick:
          activeTab === "applicants" || isModalOpen ? goBackToJobs : undefined,
        clickable: activeTab === "applicants" || isModalOpen,
      },
    ];

    if (activeTab === "applicants" || isModalOpen) {
      breadcrumbs.push({
        label: `${selectedJob?.title?.slice(0, 20)}...`,
        onClick: isModalOpen ? goBackToApplicants : undefined,
        clickable: isModalOpen,
      });
    }

    if (isModalOpen) {
      breadcrumbs.push({
        label: `${applicationDetail?.applicant?.full_name?.slice(0, 15)}...`,
        onClick: undefined,
        clickable: false,
      });
    }

    return breadcrumbs;
  };

  // Get title and description based on current view
  const getHeaderContent = () => {
    if (activeTab === "jobs") {
      return {
        title: "Jobs with Applications",
        description: "Manage applications for your posted jobs",
      };
    }
    if (activeTab === "applicants") {
      return {
        title: `Applicants for "${selectedJob?.title}"`,
        description: "Review and manage applicants",
      };
    }
    return {
      title: "Application Details",
      description: "View application details and candidate profile",
    };
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader {...getHeaderContent()} breadcrumbs={getBreadcrumbs()} />

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[600px]">
        {activeTab === "jobs" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => loadJobApplicants(job)}
                  />
                ))
              ) : (
                <NoJobsState router={router} />
              )}
            </div>
          </div>
        )}

        {activeTab === "applicants" && (
          <div className="p-6">
            <JobSummaryBanner job={selectedJob} applicants={applicants} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applicants.length > 0 ? (
                applicants.map((applicant) => (
                  <ApplicantCard
                    key={applicant.application.id}
                    applicant={applicant}
                    onClick={() => loadApplicationDetail(applicant)}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                  />
                ))
              ) : (
                <NoApplicantsState
                  goBackToJobs={goBackToJobs}
                  router={router}
                  selectedJob={selectedJob}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <ApplicationDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        applicationDetail={applicationDetail}
        selectedJob={selectedJob}
        getStatusColor={getStatusColor}
        formatDate={formatDate}
        getAvailableStatuses={getAvailableStatuses}
        updateApplicationStatus={updateApplicationStatus}
        goBackToApplicants={goBackToApplicants}
        router={router}
      />
    </div>
  );
}
