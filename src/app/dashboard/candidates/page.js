// app/dashboard/candidates/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { ApplicationNotifications } from "@/lib/services/application-notifications";
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
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadEmployerData();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load employer organization data
  const loadEmployerData = async () => {
    try {
      const { data: orgData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setOrganization(orgData);
      await loadEmployerJobs();
    } catch (error) {
      console.error("Error loading employer data:", error);
    }
  };

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

  // Enhanced updateApplicationStatus with notifications
  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      // Get current application data
      const currentApplication = applicants.find(
        (app) => app.application.id === applicationId,
      )?.application;

      if (!currentApplication) {
        throw new Error("Application not found");
      }

      const oldStatus = currentApplication.status;

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "reviewed") {
        updateData.reviewed_at = new Date().toISOString();
      } else if (newStatus === "hired") {
        updateData.hired_at = new Date().toISOString();
      }

      // 1. Optimistic UI Update
      setApplicants((prevApplicants) =>
        prevApplicants.map((item) =>
          item.application.id === applicationId
            ? {
                ...item,
                application: { ...item.application, ...updateData },
              }
            : item,
        ),
      );

      // Update modal state if open
      if (isModalOpen && applicationDetail?.application.id === applicationId) {
        setApplicationDetail((prev) => ({
          ...prev,
          application: { ...prev.application, ...updateData },
        }));
      }

      // 2. Perform the actual database update
      const { data, error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId)
        .select()
        .single();

      if (error) throw error;

      // 3. Send notification to applicant
      try {
        const notificationResult =
          await ApplicationNotifications.sendApplicationStatusUpdate({
            applicantId: currentApplication.applicant_id,
            applicationId,
            jobTitle: selectedJob?.title || "the position",
            organizationName: organization?.full_name || "the organization",
            oldStatus,
            newStatus,
            jobId: selectedJob?.id,
            organizationId: organization?.id,
          });

        if (!notificationResult.success && !notificationResult.skipped) {
          console.warn(
            "Notification failed but status updated:",
            notificationResult.error,
          );
        }
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Don't fail the entire operation if notification fails
      }

      // 4. If hired, update job as filled and notify other applicants
      if (newStatus === "hired" && selectedJob?.id) {
        await markJobAsFilled(selectedJob.id, currentApplication.applicant_id);
      }

      // 5. Refresh background data
      await Promise.all([
        loadEmployerJobs(),
        selectedJob ? loadJobApplicants(selectedJob) : Promise.resolve(),
      ]);

      // Show success message
      showNotification(
        `Status updated to ${newStatus} successfully!`,
        "success",
      );
    } catch (error) {
      console.error("Error updating status:", error);

      // Rollback optimistic update
      refreshData();

      showNotification("Failed to update status. Please try again.", "error");
    }
  };

  // Mark job as filled and notify other applicants
  const markJobAsFilled = async (jobId, hiredApplicantId) => {
    try {
      // Update job status
      const { error: jobError } = await supabase
        .from("jobs")
        .update({
          is_filled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (jobError) throw jobError;

      // Get all other applicants for this job
      const { data: otherApplications } = await supabase
        .from("applications")
        .select("applicant_id, status")
        .eq("job_id", jobId)
        .neq("applicant_id", hiredApplicantId)
        .neq("status", "rejected")
        .neq("status", "withdrawn");

      if (otherApplications && otherApplications.length > 0) {
        const otherApplicantIds = otherApplications.map(
          (app) => app.applicant_id,
        );

        // Send notifications to other applicants
        await ApplicationNotifications.sendJobFilledNotifications({
          applicantIds: otherApplicantIds,
          jobTitle: selectedJob?.title || "the position",
          organizationName: organization?.full_name || "the organization",
          jobId,
        });
      }

      // Update selected job status
      setSelectedJob((prev) => (prev ? { ...prev, is_filled: true } : prev));
    } catch (error) {
      console.error("Error marking job as filled:", error);
    }
  };

  // Show notification toast
  const showNotification = (message, type = "info") => {
    // You can integrate with a toast library like react-hot-toast
    // For now, using alert for simplicity
    if (typeof window !== "undefined") {
      alert(message);
    }
  };

  // Data fetching functions
  async function loadEmployerJobs() {
    try {
      setLoading(true);

      const { data: employerJobs, error: jobsError } = await supabase
        .from("jobs")
        .select(
          `
          id, title, job_type, location, subject, 
          grade_levels, schedule, salary_range, 
          created_at, is_filled, is_active,
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

      if (selectedJob) {
        const currentJob = jobsWithCounts.find((j) => j.id === selectedJob.id);
        if (currentJob) {
          setSelectedJob(currentJob);
        }
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      showNotification(
        "Failed to load jobs. Please refresh the page.",
        "error",
      );
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
      showNotification("Failed to load applicants. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }
  async function loadApplicationDetail(applicant) {
    try {
      setLoading(true);

      console.log("Loading application detail for applicant:", applicant);

      // First, get the application
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicant.application.id)
        .single();

      if (appError) {
        console.error("Application error details:", {
          message: appError.message,
          details: appError.details,
          hint: appError.hint,
          code: appError.code,
        });
        throw new Error(`Failed to fetch application: ${appError.message}`);
      }

      if (!application) {
        throw new Error("Application not found");
      }

      console.log("Application loaded:", application);

      // Fetch job details with organization info
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select(
          `
        *,
        organization:profiles!jobs_organization_id_fkey(*)
      `,
        )
        .eq("id", application.job_id)
        .single();

      if (jobError) {
        console.error("Job error details:", {
          message: jobError.message,
          details: jobError.details,
          hint: jobError.hint,
          code: jobError.code,
        });
        throw new Error(`Failed to fetch job: ${jobError.message}`);
      }

      if (!job) {
        throw new Error("Job not found");
      }

      console.log("Job loaded:", job);

      // Also fetch applicant's profile to ensure we have latest data
      const { data: applicantProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", application.applicant_id)
        .single();

      if (profileError) {
        console.warn(
          "Could not fetch applicant profile:",
          profileError.message,
        );
        // Don't throw, use existing profile data
      }

      setApplicationDetail({
        application,
        applicant: applicantProfile || applicant.profile, // Use fresh data if available
        job,
        organization: job.organization,
      });

      console.log("Application detail set successfully");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading application details:", {
        message: error.message,
        stack: error.stack,
        fullError: error,
      });
      showNotification(
        `Failed to load application details: ${error.message}`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

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

  // Handle new job posting
  const handlePostNewJob = () => {
    router.push("/dashboard/jobs/post");
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader
        {...getHeaderContent()}
        breadcrumbs={getBreadcrumbs()}
        onPostNewJob={activeTab === "jobs" ? handlePostNewJob : undefined}
      />

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
            <JobSummaryBanner
              job={selectedJob}
              applicants={applicants}
              organization={organization}
            />

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
        organization={organization}
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
