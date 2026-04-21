import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateApplicationEligibility } from "@/lib/policies/access-control";
import {
  denyWithPolicy,
  requireActorContext,
} from "@/lib/policies/policy-middleware";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const body = await request.json().catch(() => ({}));
    const { jobId, coverLetter, resumeUrl } = body;

    const eligibility = await evaluateApplicationEligibility({
      supabase,
      applicantId: actorContext.actor.id,
      applicantProfile: actorContext.profile,
      jobId,
      includeRemotePartTime: true,
    });

    if (!eligibility.allowed) {
      return denyWithPolicy(eligibility);
    }

    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        applicant_id: actorContext.actor.id,
        cover_letter: (coverLetter || "").trim(),
        resume_url: resumeUrl || "",
        status: "pending",
      })
      .select("id, job_id, applicant_id, status, submitted_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: insertError.message || "Failed to submit application.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      application,
      policy: {
        enforced: true,
        action: "application_create",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Failed to submit application.",
      },
      { status: 500 },
    );
  }
}
