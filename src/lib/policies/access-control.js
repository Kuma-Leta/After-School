import {
  evaluateLocationAwareJobEligibility,
  normalizeLocation,
} from "@/lib/jobs/visibility";
import { validateJobModel } from "@/lib/jobs/model";
import { isDeadlineActive } from "@/lib/jobs/deadline";
import { evaluateEmployerContactEntitlement } from "@/lib/policies/contact-entitlement";

export const EMPLOYER_ROLES = ["school", "ngo", "family"];
export const TALENT_ROLES = ["teacher", "student"];
export const POST_PLACEMENT_FEEDBACK_ROLES = ["school", "family"];
export const APPLICATION_STATUS_UPDATES = [
  "reviewed",
  "shortlisted",
  "interviewing",
  "hired",
  "rejected",
];

function isCandidateSubscriptionActive(profile) {
  if (!profile) return false;

  if ((profile.payment_status || "").toLowerCase() === "paid") {
    return true;
  }

  const isTrial = (profile.subscription_tier || "").toLowerCase() === "trial";
  if (!isTrial || !profile.trial_end_date) {
    return false;
  }

  return new Date(profile.trial_end_date).getTime() > Date.now();
}

export function isEmployerRole(role) {
  return EMPLOYER_ROLES.includes((role || "").toLowerCase());
}

export function isTalentRole(role) {
  return TALENT_ROLES.includes((role || "").toLowerCase());
}

export async function resolveRequestActor(supabase) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized",
      reason: "missing_auth_user",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, role, location, subscription_tier, payment_status, trial_end_date",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      status: 500,
      error: "Failed to load user profile",
      reason: "profile_lookup_failed",
    };
  }

  if (!profile) {
    return {
      ok: false,
      status: 404,
      error: "User profile not found",
      reason: "profile_not_found",
    };
  }

  return {
    ok: true,
    user,
    profile,
  };
}

export function evaluateJobVisibilityPolicy({
  job,
  userProfile,
  includeRemotePartTime = false,
  candidateRemotePreference = false,
  allowCrossCityBrowsing = false,
}) {
  const validationResult = validateJobModel(job);
  if (!validationResult.isValid) {
    return {
      allowed: false,
      status: 422,
      reason: "invalid_job_model",
      message: "Job has invalid model configuration",
    };
  }

  if (!isDeadlineActive(validationResult.normalized) || !job?.is_active) {
    return {
      allowed: false,
      status: 404,
      reason: "inactive_or_expired_job",
      message: "Job not found",
    };
  }

  const role = (userProfile?.role || "").toLowerCase();
  if (!isTalentRole(role)) {
    return {
      allowed: true,
      normalizedJob: validationResult.normalized,
      reason: "role_not_restricted",
    };
  }

  if (allowCrossCityBrowsing) {
    return {
      allowed: true,
      normalizedJob: validationResult.normalized,
      reason: "admin_cross_city_browsing_enabled",
      metadata: {
        allowCrossCityBrowsing: true,
      },
    };
  }

  const userLocation = normalizeLocation(userProfile?.location);
  if (!userLocation) {
    return {
      allowed: false,
      status: 403,
      reason: "missing_user_location",
      message:
        "Set your city or living address in your profile to access jobs.",
    };
  }

  const eligibility = evaluateLocationAwareJobEligibility(
    validationResult.normalized,
    userLocation,
    {
      includeRemotePartTime,
      candidateRemotePreference,
    },
  );

  if (!eligibility.eligible) {
    return {
      allowed: false,
      status: 403,
      reason: eligibility.reason || "job_visibility_restricted",
      message:
        eligibility.reason === "candidate_remote_preference_disabled"
          ? "This job supports remote work, but your remote preference is not enabled."
          : "You can only access jobs in your city or jobs that match your remote preference.",
      metadata: {
        userLocation,
        includeRemotePartTime,
        candidateRemotePreference,
        eligibility: eligibility.checks,
      },
    };
  }

  return {
    allowed: true,
    normalizedJob: validationResult.normalized,
    reason: eligibility.reason || "visible",
    metadata: {
      userLocation,
      includeRemotePartTime,
      candidateRemotePreference,
      eligibility: eligibility.checks,
    },
  };
}

export async function evaluateApplicationEligibility({
  supabase,
  applicantId,
  jobId,
  applicantProfile,
  includeRemotePartTime = true,
  candidateRemotePreference = false,
  allowCrossCityBrowsing = false,
}) {
  if (!applicantId || !jobId) {
    return {
      allowed: false,
      status: 400,
      reason: "missing_required_fields",
      message: "jobId and applicant context are required.",
    };
  }

  let profile = applicantProfile;
  if (!profile) {
    const { data: loadedProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, location")
      .eq("id", applicantId)
      .maybeSingle();

    if (profileError) {
      return {
        allowed: false,
        status: 500,
        reason: "profile_lookup_failed",
        message: "Failed to load applicant profile.",
      };
    }

    profile = loadedProfile;
  }

  if (!profile) {
    return {
      allowed: false,
      status: 404,
      reason: "profile_not_found",
      message: "Applicant profile not found.",
    };
  }

  if (!isTalentRole(profile.role)) {
    return {
      allowed: false,
      status: 403,
      reason: "non_candidate_role",
      message: "Only teachers and students can apply for jobs.",
    };
  }

  if (!isCandidateSubscriptionActive(profile)) {
    return {
      allowed: false,
      status: 402,
      reason: "subscription_required_for_apply",
      message:
        "Premium subscription is required to apply and stay visible to employers.",
      metadata: {
        paymentStatus: profile.payment_status || null,
        subscriptionTier: profile.subscription_tier || null,
        trialEndDate: profile.trial_end_date || null,
      },
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("is_active", true)
    .maybeSingle();

  if (jobError) {
    return {
      allowed: false,
      status: 500,
      reason: "job_lookup_failed",
      message: "Failed to load job.",
    };
  }

  if (!job) {
    return {
      allowed: false,
      status: 404,
      reason: "job_not_found",
      message: "Job not found.",
    };
  }

  if (job.organization_id === applicantId) {
    return {
      allowed: false,
      status: 403,
      reason: "self_application_blocked",
      message: "You cannot apply to your own job posting.",
    };
  }

  const visibility = evaluateJobVisibilityPolicy({
    job,
    userProfile: profile,
    includeRemotePartTime,
    candidateRemotePreference,
    allowCrossCityBrowsing,
  });

  if (!visibility.allowed) {
    return visibility;
  }

  const { count, error: applicationCheckError } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("applicant_id", applicantId);

  if (applicationCheckError) {
    return {
      allowed: false,
      status: 500,
      reason: "application_lookup_failed",
      message: "Failed to verify existing application.",
    };
  }

  if ((count || 0) > 0) {
    return {
      allowed: false,
      status: 409,
      reason: "already_applied",
      message: "You have already applied for this job.",
    };
  }

  return {
    allowed: true,
    reason: "eligible",
    job: visibility.normalizedJob,
  };
}

export async function evaluateContactInitiationPolicy({
  supabase,
  adminClient,
  employerId,
  candidateId,
  requireApplication = true,
  subscriptionRequiredForEmployerContact = true,
}) {
  return evaluateEmployerContactEntitlement({
    supabase,
    adminClient,
    employerId,
    candidateId,
    requireApplication,
    subscriptionRequiredForEmployerContact,
  });
}

export async function evaluateHireActionEligibility({
  supabase,
  actorId,
  applicationId,
  targetStatus,
  actorProfile,
}) {
  if (!applicationId || !targetStatus) {
    return {
      allowed: false,
      status: 400,
      reason: "missing_required_fields",
      message: "applicationId and status are required.",
    };
  }

  if (!APPLICATION_STATUS_UPDATES.includes(targetStatus)) {
    return {
      allowed: false,
      status: 400,
      reason: "invalid_status",
      message: "Invalid application status update.",
    };
  }

  let profile = actorProfile;
  if (!profile) {
    const { data: loadedProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", actorId)
      .maybeSingle();

    if (profileError) {
      return {
        allowed: false,
        status: 500,
        reason: "profile_lookup_failed",
        message: "Failed to load actor profile.",
      };
    }

    profile = loadedProfile;
  }

  if (!isEmployerRole(profile?.role)) {
    return {
      allowed: false,
      status: 403,
      reason: "employer_role_required",
      message: "Only employers can update candidate applications.",
    };
  }

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, job_id, status, applicant_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError) {
    return {
      allowed: false,
      status: 500,
      reason: "application_lookup_failed",
      message: "Failed to load application.",
    };
  }

  if (!application) {
    return {
      allowed: false,
      status: 404,
      reason: "application_not_found",
      message: "Application not found.",
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, organization_id, is_filled")
    .eq("id", application.job_id)
    .maybeSingle();

  if (jobError) {
    return {
      allowed: false,
      status: 500,
      reason: "job_lookup_failed",
      message: "Failed to load job for this application.",
    };
  }

  if (!job) {
    return {
      allowed: false,
      status: 404,
      reason: "job_not_found",
      message: "Related job was not found.",
    };
  }

  if (job.organization_id !== actorId) {
    return {
      allowed: false,
      status: 403,
      reason: "not_job_owner",
      message: "You can only update applications for your own jobs.",
    };
  }

  if (application.status === "hired" && targetStatus !== "hired") {
    return {
      allowed: false,
      status: 409,
      reason: "hired_status_locked",
      message: "Hired applications cannot be moved to another status.",
    };
  }

  if (targetStatus === "hired") {
    if (job.is_filled && application.status !== "hired") {
      return {
        allowed: false,
        status: 409,
        reason: "job_already_filled",
        message: "This job has already been marked as filled.",
      };
    }

    const { count, error: hiredCheckError } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", application.job_id)
      .eq("status", "hired")
      .neq("id", application.id);

    if (hiredCheckError) {
      return {
        allowed: false,
        status: 500,
        reason: "hired_check_failed",
        message: "Failed to verify existing hired candidates.",
      };
    }

    if ((count || 0) > 0) {
      return {
        allowed: false,
        status: 409,
        reason: "candidate_already_hired",
        message: "Another candidate is already hired for this job.",
      };
    }
  }

  return {
    allowed: true,
    reason: "eligible",
    application,
    job,
  };
}

export async function evaluatePostPlacementFeedbackEligibility({
  supabase,
  actorId,
  applicationId,
  actorProfile,
  allowedReviewerRoles = POST_PLACEMENT_FEEDBACK_ROLES,
}) {
  if (!applicationId) {
    return {
      allowed: false,
      status: 400,
      reason: "missing_required_fields",
      message: "applicationId is required.",
    };
  }

  let profile = actorProfile;
  if (!profile) {
    const { data: loadedProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", actorId)
      .maybeSingle();

    if (profileError) {
      return {
        allowed: false,
        status: 500,
        reason: "profile_lookup_failed",
        message: "Failed to load actor profile.",
      };
    }

    profile = loadedProfile;
  }

  if (!profile) {
    return {
      allowed: false,
      status: 404,
      reason: "profile_not_found",
      message: "Profile not found.",
    };
  }

  if (!allowedReviewerRoles.includes((profile.role || "").toLowerCase())) {
    return {
      allowed: false,
      status: 403,
      reason: "reviewer_role_not_allowed",
      message:
        "Only family and school accounts can submit post-placement feedback.",
    };
  }

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, job_id, applicant_id, status, hired_at")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError) {
    return {
      allowed: false,
      status: 500,
      reason: "application_lookup_failed",
      message: "Failed to load application.",
    };
  }

  if (!application) {
    return {
      allowed: false,
      status: 404,
      reason: "application_not_found",
      message: "Application not found.",
    };
  }

  if (application.status !== "hired") {
    return {
      allowed: false,
      status: 409,
      reason: "placement_not_completed",
      message:
        "Post-placement feedback is only available after a candidate is marked as hired.",
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, organization_id")
    .eq("id", application.job_id)
    .maybeSingle();

  if (jobError) {
    return {
      allowed: false,
      status: 500,
      reason: "job_lookup_failed",
      message: "Failed to load job for this application.",
    };
  }

  if (!job) {
    return {
      allowed: false,
      status: 404,
      reason: "job_not_found",
      message: "Related job was not found.",
    };
  }

  if (job.organization_id !== actorId) {
    return {
      allowed: false,
      status: 403,
      reason: "not_job_owner",
      message: "You can only leave post-placement feedback for your own hires.",
    };
  }

  return {
    allowed: true,
    reason: "eligible",
    application,
    job,
    reviewerProfile: profile,
  };
}
