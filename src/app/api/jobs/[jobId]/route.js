import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isJobVisibleToUser, normalizeLocation } from "@/lib/jobs/visibility";

const TALENT_ROLES = ["teacher", "student"];

function isDeadlineActive(job) {
  if (!job?.application_deadline) return true;
  return new Date(job.application_deadline) >= new Date();
}

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const includeRemotePartTime =
      searchParams.get("includeRemotePartTime") === "true";

    const jobId = params?.jobId;

    if (!jobId) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("is_active", true)
      .maybeSingle();

    if (jobError) {
      return NextResponse.json(
        { error: "Failed to load job" },
        { status: 500 },
      );
    }

    if (!job || !isDeadlineActive(job)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const role = (profile?.role || "").toLowerCase();
    const userLocation = normalizeLocation(profile?.location);

    if (TALENT_ROLES.includes(role)) {
      if (!userLocation) {
        return NextResponse.json(
          {
            error:
              "Set your city or living address in your profile to access jobs.",
          },
          { status: 403 },
        );
      }

      const canAccess = isJobVisibleToUser(job, userLocation, {
        includeRemotePartTime,
      });

      if (!canAccess) {
        return NextResponse.json(
          {
            error:
              "You can only access jobs in your city or remote part-time jobs.",
          },
          { status: 403 },
        );
      }
    }

    let organizationProfile = null;
    if (job.organization_id) {
      const { data: orgProfile } = await supabase
        .from("profiles")
        .select("full_name, role, location, phone")
        .eq("id", job.organization_id)
        .maybeSingle();

      organizationProfile = orgProfile;
    }

    const hydratedJob = {
      ...job,
      organizations: {
        org_name: organizationProfile?.full_name || "Private Employer",
        org_type: organizationProfile?.role || "organization",
        verified: false,
        contact_person: organizationProfile?.full_name || "Contact",
        location: organizationProfile?.location || job.location || "",
        phone: organizationProfile?.phone || "",
      },
    };

    return NextResponse.json({ job: hydratedJob });
  } catch (error) {
    console.error("/api/jobs/[jobId] error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
