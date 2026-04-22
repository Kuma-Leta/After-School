import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/features/admin/server/auth";
import { evaluateContactInitiationPolicy } from "@/lib/policies/access-control";
import { loadEffectivePolicyControls } from "@/lib/policies/policy-controls";
import { requireActorContext } from "@/lib/policies/policy-middleware";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);
    if (!actorContext.ok) {
      return actorContext.response;
    }

    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");
    const requireApplication =
      searchParams.get("requireApplication") !== "false";

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId query parameter is required." },
        { status: 400 },
      );
    }

    const adminClient = createServiceRoleClient();
    const policyControls = await loadEffectivePolicyControls();
    const policyResult = await evaluateContactInitiationPolicy({
      supabase,
      adminClient,
      employerId: actorContext.actor.id,
      candidateId,
      requireApplication,
      subscriptionRequiredForEmployerContact:
        policyControls.subscriptionRequiredForEmployerContact,
    });

    return NextResponse.json({
      ...policyResult,
      employerId: actorContext.actor.id,
      candidateId,
      requireApplication,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to evaluate employer-to-candidate contact entitlement.",
      },
      { status: 500 },
    );
  }
}
