// app/dashboard/candidates/components/hooks/useEmployerJobs.js
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useEmployerJobs(user) {
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load employer's jobs
  const loadEmployerJobs = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching jobs for user:", user.id);

      // Fetch jobs where this user is the organization
      const { data: employerJobs, error: jobsError } = await supabase
        .from("jobs")
        .select(
          `
          *,
          applications:applications (
            id,
            status,
            submitted_at
          )
        `,
        )
        .eq("organization_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      // Transform the data - show only jobs that have at least one application
      const jobsWithCounts = employerJobs
        .map((job) => {
          const applications = job.applications || [];
          const applicationCount = applications.length;

          return {
            id: job.id,
            title: job.title,
            job_type: job.job_type,
            location: job.location,
            subject: job.subject,
            grade_levels: job.grade_levels,
            schedule: job.schedule,
            salary_range: job.salary_range,
            created_at: job.created_at,
            is_filled: job.is_filled,
            is_active: job.is_active,
            vacancies: job.vacancies,
            application_deadline: job.application_deadline,
            description: job.description,
            organization_id: job.organization_id,
            application_count: applicationCount,
            pending_count: applications.filter((a) => a.status === "pending")
              .length,
            shortlisted_count: applications.filter(
              (a) => a.status === "shortlisted",
            ).length,
            hired_count: applications.filter((a) => a.status === "hired")
              .length,
          };
        })
        .filter((job) => job.application_count > 0); // Only show jobs with applications

      console.log("Processed jobs:", jobsWithCounts);
      setJobs(jobsWithCounts);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load applicants for a specific job
  const loadJobApplicants = useCallback(async (jobId) => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching applicants for job:", jobId);

      // First, get all applications for this job
      const { data: applications, error: appsError } = await supabase
        .from("applications")
        .select(
          `
          id,
          status,
          submitted_at,
          cover_letter,
          resume_url,
          reviewed_at,
          hired_at,
          updated_at,
          applicant_id
        `,
        )
        .eq("job_id", jobId)
        .order("submitted_at", { ascending: false });

      if (appsError) throw appsError;

      if (!applications || applications.length === 0) {
        setApplicants([]);
        return;
      }

      // Get all applicant profiles WITH EMAIL
      const applicantIds = applications.map((app) => app.applicant_id);
      const { data: applicantProfiles, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          email,  
          full_name,
          phone,
          role,
          location,
          bio,
          avatar_url,
          date_of_birth,
          gender,
          languages,
          profile_completion
        `,
        )
        .in("id", applicantIds);

      if (profileError) throw profileError;

      // Combine application data with applicant profiles
      const combinedApplicants = applications.map((application) => {
        const profile =
          applicantProfiles?.find((p) => p.id === application.applicant_id) ||
          {};

        // Calculate age if date of birth is available
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
          id: application.id,
          status: application.status,
          submittedAt: application.submitted_at,
          coverLetter: application.cover_letter,
          resumeUrl: application.resume_url,
          reviewed_at: application.reviewed_at,
          hired_at: application.hired_at,
          updated_at: application.updated_at,
          applicant: {
            id: profile.id,
            email: profile.email, // ADD THIS
            fullName: profile.full_name,
            phone: profile.phone,
            role: profile.role,
            location: profile.location,
            bio: profile.bio,
            avatarUrl: profile.avatar_url,
            dateOfBirth: profile.date_of_birth,
            age,
            gender: profile.gender,
            languages,
            profileCompletion: profile.profile_completion,
          },
        };
      });

      setApplicants(combinedApplicants);
    } catch (err) {
      console.error("Error loading job applicants:", err);
      setError(err.message);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh jobs list
  const refreshJobs = useCallback(async () => {
    await loadEmployerJobs();
  }, [loadEmployerJobs]);

  // Refresh applicants list
  const refreshApplicants = useCallback(
    async (jobId) => {
      await loadJobApplicants(jobId);
    },
    [loadJobApplicants],
  );

  // Load jobs on initial mount
  useEffect(() => {
    if (user) {
      loadEmployerJobs();
    }
  }, [user, loadEmployerJobs]);

  return {
    jobs,
    applicants,
    loading,
    error,
    loadEmployerJobs,
    loadJobApplicants,
    refreshJobs,
    refreshApplicants,
  };
}
