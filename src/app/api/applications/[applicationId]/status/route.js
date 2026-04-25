import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateHireActionEligibility } from "@/lib/policies/access-control";
import {
  denyWithPolicy,
  requireActorContext,
} from "@/lib/policies/policy-middleware";

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams?.applicationId;
    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetStatus = body?.status;

    const policyResult = await evaluateHireActionEligibility({
      supabase,
      actorId: actorContext.actor.id,
      actorProfile: actorContext.profile,
      applicationId,
      targetStatus,
    });

    if (!policyResult.allowed) {
      return denyWithPolicy(policyResult);
    }

    const nowIso = new Date().toISOString();
    const updateData = {
      status: targetStatus,
      updated_at: nowIso,
    };

    if (targetStatus === "reviewed") {
      updateData.reviewed_at = nowIso;
    }

    if (targetStatus === "hired") {
      updateData.hired_at = nowIso;
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", applicationId)
      .select(
        "id, job_id, applicant_id, status, reviewed_at, hired_at, updated_at",
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          error: updateError.message || "Failed to update application status.",
        },
        { status: 500 },
      );
    }

    if (targetStatus === "hired") {
      const { error: fillError } = await supabase
        .from("jobs")
        .update({
          is_filled: true,
          updated_at: nowIso,
        })
        .eq("id", policyResult.job.id);

      if (fillError) {
        return NextResponse.json(
          {
            error:
              fillError.message ||
              "Application updated, but failed to mark job as filled.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      policy: {
        enforced: true,
        action:
          targetStatus === "hired"
            ? "hire_action"
            : "application_status_update",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Failed to update application status.",
      },
      { status: 500 },
    );
  }
}
