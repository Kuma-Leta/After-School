import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateJobVisibilityPolicy } from "@/lib/policies/access-control";
import {
  denyWithPolicy,
  requireActorContext,
} from "@/lib/policies/policy-middleware";

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
    const candidateRemotePreference =
      searchParams.get("candidateRemotePreference") === "true";

    const jobId = params?.jobId;

    if (!jobId) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    const actorContext = await requireActorContext(supabase);
    if (!actorContext.ok) {
      return actorContext.response;
    }

    const profile = actorContext.profile;

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

    const visibilityPolicy = evaluateJobVisibilityPolicy({
      job,
      userProfile: profile,
      includeRemotePartTime,
      candidateRemotePreference,
    });

    if (!visibilityPolicy.allowed) {
      return denyWithPolicy(visibilityPolicy);
    }

    const normalizedJob = visibilityPolicy.normalizedJob;

    let organizationProfile = null;
    if (normalizedJob.organization_id) {
      const { data: orgProfile } = await supabase
        .from("profiles")
        .select("full_name, role, location, phone")
        .eq("id", normalizedJob.organization_id)
        .maybeSingle();

      organizationProfile = orgProfile;
    }

    const hydratedJob = {
      ...normalizedJob,
      eligibility: {
        reason: visibilityPolicy.reason,
        ...(visibilityPolicy.metadata?.eligibility || {}),
      },
      organizations: {
        org_name: organizationProfile?.full_name || "Private Employer",
        org_type: organizationProfile?.role || "organization",
        verified: false,
        contact_person: organizationProfile?.full_name || "Contact",
        location: organizationProfile?.location || normalizedJob.location || "",
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
