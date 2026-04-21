// lib/supabase/candidates.js
import { supabase } from "./client";

// Get employer's jobs with application counts
export async function getEmployerJobs(userId) {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      *,
      applications:applications(count)
    `,
    )
    .eq("organization_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((job) => ({
    ...job,
    application_count: job.applications[0]?.count || 0,
  }));
}

// Get applicants for a specific job
export async function getJobApplicants(jobId) {
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      applicant:profiles(*)
    `,
    )
    .eq("job_id", jobId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return data.map((app) => ({
    id: app.id,
    status: app.status,
    submitted_at: app.submitted_at,
    cover_letter: app.cover_letter,
    resume_url: app.resume_url,
    applicant: app.applicant,
  }));
}

// Update application status
export async function updateApplicationStatus(applicationId, status) {
  const response = await fetch(`/api/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Failed to update application status.");
  }

  return payload?.application;
}

// Mark job as filled
export async function markJobAsFilled(jobId) {
  throw new Error(
    "markJobAsFilled is no longer supported directly. Use application status API with status='hired'.",
  );
}
