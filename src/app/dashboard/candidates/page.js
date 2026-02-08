// app/dashboard/candidates/page.js - Update the main page
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEmployerJobs } from "./components/hooks/useEmployerJobs";
import Header from "./components/Layout/Header";
import JobList from "./components/JobList/JobList";
import ApplicantList from "./components/ApplicantList/ApplicantList";
import ApplicationDetailModal from "./components/ApplicationDetail/ApplicationDetailModal";
import LoadingSpinner from "./components/Layout/LoadingSpinner";

export default function CandidatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const {
    jobs,
    applicants,
    loading,
    error,
    loadJobApplicants,
    refreshJobs,
    refreshApplicants,
  } = useEmployerJobs(user);

  // Handle job selection
  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    await loadJobApplicants(job.id);
  };

  // Handle application selection
  const handleSelectApplication = (application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  // Handle back to jobs
  const handleBackToJobs = () => {
    setSelectedJob(null);
    setSelectedApplication(null);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  // Handle status update (callback for modal)
  const handleStatusUpdate = async () => {
    if (selectedJob) {
      await refreshApplicants(selectedJob.id);
    }
    await refreshJobs();
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Track initial load
  useEffect(() => {
    if (!authLoading && !loading && initialLoad) {
      setInitialLoad(false);
    }
  }, [authLoading, loading, initialLoad]);

  // Show loading for initial authentication check
  if (authLoading || initialLoad) {
    return <LoadingSpinner />;
  }

  // Don't render anything if redirecting
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title={
          selectedJob
            ? `Applicants for "${selectedJob.title}"`
            : "Jobs with Applications"
        }
        description={
          selectedJob
            ? "Review and manage applicants"
            : "Manage applications for your posted jobs"
        }
        onBack={selectedJob ? handleBackToJobs : null}
        showBackButton={!!selectedJob}
      />

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[600px]">
        {!selectedJob ? (
          <JobList
            jobs={jobs}
            loading={loading}
            error={error}
            onSelectJob={handleSelectJob}
            onRefresh={refreshJobs}
          />
        ) : (
          <ApplicantList
            job={selectedJob}
            applicants={applicants}
            loading={loading}
            error={error}
            onSelectApplicant={handleSelectApplication}
            onRefresh={() => refreshApplicants(selectedJob.id)}
          />
        )}
      </div>

      <ApplicationDetailModal
        isOpen={isModalOpen}
        application={selectedApplication}
        job={selectedJob}
        onClose={handleCloseModal}
        onStatusUpdate={handleStatusUpdate}
        onBackToApplicants={() => setIsModalOpen(false)}
      />
    </div>
  );
}
