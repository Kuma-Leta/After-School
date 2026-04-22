const EMPLOYER_ROLES = ["school", "ngo", "family"];
const CANDIDATE_ROLES = ["teacher", "student"];

function isEmployerRole(role) {
  return EMPLOYER_ROLES.includes((role || "").toLowerCase());
}

function isCandidateRole(role) {
  return CANDIDATE_ROLES.includes((role || "").toLowerCase());
}

function isSubscriptionActive(profile) {
  if (!profile) return false;

  const paymentStatus = (profile.payment_status || "").toLowerCase();
  if (paymentStatus === "paid") {
    return true;
  }

  const subscriptionTier = (profile.subscription_tier || "").toLowerCase();
  if (subscriptionTier === "trial" && profile.trial_end_date) {
    return new Date(profile.trial_end_date).getTime() > Date.now();
  }

  return false;
}

function isEmployerInGoodStanding(authUser) {
  return !authUser?.banned_until;
}

export async function evaluateEmployerContactEntitlement({
  supabase,
  adminClient,
  employerId,
  candidateId,
  requireApplication = true,
  subscriptionRequiredForEmployerContact = true,
}) {
  if (!employerId || !candidateId) {
    return {
      allowed: false,
      reason: "missing_required_ids",
      message: "Employer and candidate identifiers are required.",
      policyApplied: true,
    };
  }

  const [employerProfileResult, candidateProfileResult, employerAuthResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, role")
        .eq("id", employerId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, role, subscription_tier, payment_status, trial_end_date")
        .eq("id", candidateId)
        .maybeSingle(),
      adminClient.auth.admin.getUserById(employerId),
    ]);

  if (employerProfileResult.error) {
    throw new Error(
      employerProfileResult.error.message || "Failed to load employer profile.",
    );
  }

  if (candidateProfileResult.error) {
    throw new Error(
      candidateProfileResult.error.message ||
        "Failed to load candidate profile.",
    );
  }

  if (employerAuthResult.error) {
    throw new Error(
      employerAuthResult.error.message ||
        "Failed to load employer account status.",
    );
  }

  const employerProfile = employerProfileResult.data;
  const candidateProfile = candidateProfileResult.data;
  const employerAuthUser = employerAuthResult.data?.user;

  if (!employerProfile || !candidateProfile) {
    return {
      allowed: false,
      reason: "profile_not_found",
      message: "Unable to verify contact permissions for this user.",
      policyApplied: true,
    };
  }

  if (
    !isEmployerRole(employerProfile.role) ||
    !isCandidateRole(candidateProfile.role)
  ) {
    return {
      allowed: true,
      reason: "non_employer_candidate_pair",
      message: "Contact entitlement policy not required for this role pair.",
      policyApplied: false,
    };
  }

  if (!isEmployerInGoodStanding(employerAuthUser)) {
    return {
      allowed: false,
      reason: "employer_not_in_good_standing",
      message: "Employer account is not in good standing.",
      policyApplied: true,
      checks: {
        employerStanding: false,
      },
    };
  }

  const subscriptionActive = isSubscriptionActive(candidateProfile);
  if (subscriptionRequiredForEmployerContact && !subscriptionActive) {
    return {
      allowed: false,
      reason: "candidate_subscription_inactive",
      message: "Candidate subscription is not active.",
      policyApplied: true,
      checks: {
        employerStanding: true,
        candidateSubscriptionActive: false,
      },
    };
  }

  let applicationExists = true;
  if (requireApplication) {
    const { data: employerJobs, error: employerJobsError } = await supabase
      .from("jobs")
      .select("id")
      .eq("organization_id", employerId);

    if (employerJobsError) {
      throw new Error(
        employerJobsError.message ||
          "Failed to verify employer jobs for contact policy.",
      );
    }

    const jobIds = (employerJobs || []).map((job) => job.id).filter(Boolean);
    if (jobIds.length === 0) {
      return {
        allowed: false,
        reason: "candidate_application_missing",
        message:
          "Candidate must apply to one of your jobs before contact is allowed.",
        policyApplied: true,
        checks: {
          employerStanding: true,
          candidateSubscriptionActive: true,
          applicationExists: false,
        },
      };
    }

    const { count, error: applicationError } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("applicant_id", candidateId)
      .in("job_id", jobIds);

    if (applicationError) {
      throw new Error(
        applicationError.message || "Failed to verify application eligibility.",
      );
    }

    applicationExists = (count || 0) > 0;
    if (!applicationExists) {
      return {
        allowed: false,
        reason: "candidate_application_missing",
        message:
          "Candidate must apply to one of your jobs before contact is allowed.",
        policyApplied: true,
        checks: {
          employerStanding: true,
          candidateSubscriptionActive: true,
          applicationExists: false,
        },
      };
    }
  }

  return {
    allowed: true,
    reason: "allowed",
    message: "Employer can contact this candidate.",
    policyApplied: true,
    checks: {
      employerStanding: true,
      candidateSubscriptionActive:
        !subscriptionRequiredForEmployerContact || subscriptionActive,
      applicationExists,
    },
  };
}
