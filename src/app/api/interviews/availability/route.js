import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TALENT_ROLES } from "@/lib/policies/access-control";
import { requireActorContext } from "@/lib/policies/policy-middleware";
import {
  buildInterviewSchedulingSetupErrorResponsePayload,
  isInterviewSchedulingMissingTableError,
} from "@/lib/interviews/errors";

const SCHOOL_ROLE = "school";

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

function isTalentRole(role) {
  return TALENT_ROLES.includes((role || "").toLowerCase());
}

function validateSlotInput({ startAt, endAt }) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: "Invalid date format for startAt or endAt." };
  }

  if (end <= start) {
    return { ok: false, error: "endAt must be later than startAt." };
  }

  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes < 20 || durationMinutes > 240) {
    return {
      ok: false,
      error: "Interview slots must be between 20 and 240 minutes.",
    };
  }

  if (start.getTime() <= Date.now()) {
    return { ok: false, error: "Interview slots must be in the future." };
  }

  return { ok: true, startIso: start.toISOString(), endIso: end.toISOString() };
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorRole = (actorContext.profile?.role || "").toLowerCase();
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get("tutorId");

    if (tutorId) {
      if (actorRole !== SCHOOL_ROLE) {
        return NextResponse.json(
          { error: "Only schools can browse tutor interview availability." },
          { status: 403 },
        );
      }

      const { data, error } = await supabase
        .from("interview_availability_slots")
        .select(
          "id, tutor_id, start_at, end_at, timezone, notes, status, created_at",
        )
        .eq("tutor_id", tutorId)
        .eq("status", "open")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true });

      if (error) {
        return createDbErrorResponse(
          error,
          "Failed to load interview availability.",
        );
      }

      return NextResponse.json({ slots: data || [] });
    }

    if (!isTalentRole(actorRole)) {
      return NextResponse.json(
        {
          error:
            "Only teachers and students can manage interview availability.",
        },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("interview_availability_slots")
      .select(
        "id, tutor_id, start_at, end_at, timezone, notes, status, created_at, updated_at",
      )
      .eq("tutor_id", actorContext.actor.id)
      .order("start_at", { ascending: true });

    if (error) {
      return createDbErrorResponse(
        error,
        "Failed to load interview availability.",
      );
    }

    return NextResponse.json({ slots: data || [] });
  } catch (error) {
    return createDbErrorResponse(
      error,
      "Failed to load interview availability.",
    );
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorRole = (actorContext.profile?.role || "").toLowerCase();
    if (!isTalentRole(actorRole)) {
      return NextResponse.json(
        { error: "Only teachers and students can add interview slots." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateSlotInput({
      startAt: body?.startAt,
      endAt: body?.endAt,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const timezone = (body?.timezone || "UTC").toString().slice(0, 80);
    const notes = (body?.notes || "").toString().trim().slice(0, 500);

    const { data, error } = await supabase
      .from("interview_availability_slots")
      .insert({
        tutor_id: actorContext.actor.id,
        start_at: validation.startIso,
        end_at: validation.endIso,
        timezone,
        notes,
        status: "open",
      })
      .select(
        "id, tutor_id, start_at, end_at, timezone, notes, status, created_at",
      )
      .single();

    if (error) {
      return createDbErrorResponse(
        error,
        "Failed to add interview availability.",
      );
    }

    return NextResponse.json({ success: true, slot: data });
  } catch (error) {
    return createDbErrorResponse(
      error,
      "Failed to add interview availability.",
    );
  }
}
