import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isJobVisibleToUser, normalizeLocation } from "@/lib/jobs/visibility";
import { normalizeJobModel, validateJobModel } from "@/lib/jobs/model";

const TALENT_ROLES = ["teacher", "student"];

function isDeadlineActive(job) {
  if (!job?.application_deadline) return true;
  return new Date(job.application_deadline) >= new Date();
}

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const activeJobs = (jobsData || []).filter(isDeadlineActive);
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, location")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to load user profile" },
        { status: 500 },
      );
    }

    const role = (profile?.role || "").toLowerCase();
    const userLocation = normalizeLocation(profile?.location);

    let visibleJobs = validJobs;

    if (TALENT_ROLES.includes(role)) {
      if (!userLocation) {
        return NextResponse.json(
          {
            jobs: [],
            policy: {
              enforced: true,
              includeRemotePartTime,
              reason: "missing_user_location",
            },
            message:
              "Set your city or living address in your profile to view jobs.",
          },
          { status: 200 },
        );
      }

      visibleJobs = validJobs.filter((job) =>
        isJobVisibleToUser(job, userLocation, { includeRemotePartTime }),
      );
    }

    const enrichedJobs = await enrichJobsWithOrganizations(
      supabase,
      visibleJobs,
    );

    return NextResponse.json({
      jobs: enrichedJobs,
      policy: {
        enforced: TALENT_ROLES.includes(role),
        includeRemotePartTime,
        userLocation,
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
