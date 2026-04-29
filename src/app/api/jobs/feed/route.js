import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDeadlineActive } from "@/lib/jobs/deadline";
import { validateJobModel } from "@/lib/jobs/model";
import {
  evaluateJobVisibilityPolicy,
  isTalentRole,
} from "@/lib/policies/access-control";
import { loadEffectivePolicyControls } from "@/lib/policies/policy-controls";
import { requireActorContext } from "@/lib/policies/policy-middleware";

async function enrichJobsWithOrganizations(supabase, jobs) {
  return Promise.all(
    (jobs || []).map(async (job) => {
      let organizationProfile = null;

      if (job.organization_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, role, location, phone")
          .eq("id", job.organization_id)
          .maybeSingle();

        organizationProfile = profileData;
      }

      return {
        ...job,
        organizations: {
          org_name: organizationProfile?.full_name || "Private Employer",
          org_type: organizationProfile?.role || "school",
          verified: false,
          contact_person: organizationProfile?.full_name || "Contact Person",
        },
      };
    }),
  );
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const includeRemotePartTime =
      searchParams.get("includeRemotePartTime") === "true";
    const candidateRemotePreference =
      searchParams.get("candidateRemotePreference") === "true";

    const actorContext = await requireActorContext(supabase);
    const user = actorContext.ok ? actorContext.actor : null;
    const profile = actorContext.ok ? actorContext.profile : null;
    const policyControls = await loadEffectivePolicyControls();

    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (jobsError) {
      return NextResponse.json(
        { error: "Failed to load jobs" },
        { status: 500 },
      );
    }

    const activeJobs = (jobsData || []).filter((job) =>
      isDeadlineActive(job?.application_deadline),
    );
    const validJobs = activeJobs
      .map((job) => {
        const { isValid, normalized } = validateJobModel(job);
        return isValid ? normalized : null;
      })
      .filter(Boolean);

    if (!user?.id) {
      const publicJobs = await enrichJobsWithOrganizations(supabase, validJobs);
      return NextResponse.json({
        jobs: publicJobs,
        policy: {
          enforced: false,
          reason: "unauthenticated",
        },
      });
    }

    const role = (profile?.role || "").toLowerCase();
    let visibleJobs = validJobs;

    if (isTalentRole(role) && validJobs.length > 0) {
      visibleJobs = validJobs
        .map((job) => ({
          job,
          policy: evaluateJobVisibilityPolicy({
            job,
            userProfile: profile,
            includeRemotePartTime,
            candidateRemotePreference,
            allowCrossCityBrowsing: policyControls.allowCrossCityBrowsing,
          }),
        }))
        .filter((entry) => entry.policy.allowed)
        .map((entry) => ({
          ...(entry.policy.normalizedJob || entry.job),
          eligibility: {
            reason: entry.policy.reason,
            ...(entry.policy.metadata?.eligibility || {}),
          },
        }));
    }

    const enrichedJobs = await enrichJobsWithOrganizations(
      supabase,
      visibleJobs,
    );

    return NextResponse.json({
      jobs: enrichedJobs,
      policy: {
        enforced: isTalentRole(role),
        includeRemotePartTime,
        candidateRemotePreference,
        userLocation: profile?.location || null,
        controls: policyControls,
      },
    });
  } catch (error) {
    console.error("/api/jobs/feed error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
