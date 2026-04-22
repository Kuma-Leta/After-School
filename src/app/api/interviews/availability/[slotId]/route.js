import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TALENT_ROLES } from "@/lib/policies/access-control";
import { requireActorContext } from "@/lib/policies/policy-middleware";
import {
  buildInterviewSchedulingSetupErrorResponsePayload,
  isInterviewSchedulingMissingTableError,
} from "@/lib/interviews/errors";

function isTalentRole(role) {
  return TALENT_ROLES.includes((role || "").toLowerCase());
}

function createDbErrorResponse(error, fallbackMessage) {
  if (isInterviewSchedulingMissingTableError(error)) {
    return NextResponse.json(
      buildInterviewSchedulingSetupErrorResponsePayload(),
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: error?.message || fallbackMessage },
    { status: 500 },
  );
}

export async function DELETE(_request, { params }) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorRole = (actorContext.profile?.role || "").toLowerCase();
    if (!isTalentRole(actorRole)) {
      return NextResponse.json(
        { error: "Only teachers and students can remove interview slots." },
        { status: 403 },
      );
    }

    const slotId = params?.slotId;
    if (!slotId) {
      return NextResponse.json(
        { error: "slotId is required." },
        { status: 400 },
      );
    }

    const { data: slot, error: slotError } = await supabase
      .from("interview_availability_slots")
      .select("id, tutor_id, status")
      .eq("id", slotId)
      .maybeSingle();

    if (slotError) {
      return createDbErrorResponse(slotError, "Failed to load slot.");
    }

    if (!slot || slot.tutor_id !== actorContext.actor.id) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    if (slot.status === "booked") {
      return NextResponse.json(
        { error: "Booked interview slots cannot be deleted." },
        { status: 409 },
      );
    }

    const { data: activeRequests, error: requestError } = await supabase
      .from("interview_slot_requests")
      .select("id")
      .eq("availability_slot_id", slotId)
      .in("status", ["pending", "accepted"])
      .limit(1);

    if (requestError) {
      return createDbErrorResponse(
        requestError,
        "Failed to verify slot requests.",
      );
    }

    if (activeRequests && activeRequests.length > 0) {
      return NextResponse.json(
        {
          error:
            "This slot already has an active request. Please respond to requests before removing it.",
        },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("interview_availability_slots")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", slotId)
      .eq("tutor_id", actorContext.actor.id);

    if (updateError) {
      return createDbErrorResponse(updateError, "Failed to cancel slot.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to cancel slot.");
  }
}
