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
  const updateData = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "reviewed") {
    updateData.reviewed_at = new Date().toISOString();
  } else if (status === "hired") {
    updateData.hired_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("applications")
    .update(updateData)
    .eq("id", applicationId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Mark job as filled
export async function markJobAsFilled(jobId) {
  const { error } = await supabase
    .from("jobs")
    .update({
      is_filled: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) throw error;
}
