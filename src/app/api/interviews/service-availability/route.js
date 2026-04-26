import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TALENT_ROLES } from "@/lib/policies/access-control";
import { requireActorContext } from "@/lib/policies/policy-middleware";
import {
  buildInterviewSchedulingSetupErrorResponsePayload,
  isInterviewSchedulingMissingTableError,
} from "@/lib/interviews/errors";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

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

function createDefaultWeek(timezone) {
  return DAYS.map((day) => ({
    dayOfWeek: day,
    isAvailable: false,
    startTime: null,
    endTime: null,
    timezone,
    notes: "",
  }));
}

function normalizeStoredWeek(rows, timezone) {
  const defaults = createDefaultWeek(timezone);
  for (const row of rows || []) {
    const day = Number(row.day_of_week);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;

    defaults[day] = {
      dayOfWeek: day,
      isAvailable: Boolean(row.is_available),
      startTime: row.start_time || null,
      endTime: row.end_time || null,
      timezone: row.timezone || timezone,
      notes: row.notes || "",
    };
  }
  return defaults;
}

function normalizePayloadWeek(week = [], fallbackTimezone = "UTC") {
  if (!Array.isArray(week)) {
    return { ok: false, error: "availability must be an array." };
  }

  const normalized = new Array(7).fill(null);

  for (const entry of week) {
    const day = Number(entry?.dayOfWeek);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return { ok: false, error: "dayOfWeek must be between 0 and 6." };
    }

    const isAvailable = Boolean(entry?.isAvailable);
    const timezone = (entry?.timezone || fallbackTimezone || "UTC")
      .toString()
      .trim()
      .slice(0, 80);
    const notes = (entry?.notes || "").toString().trim().slice(0, 500);

    let startTime = null;
    let endTime = null;

    if (isAvailable) {
      startTime = (entry?.startTime || "").toString().trim();
      endTime = (entry?.endTime || "").toString().trim();

      if (!startTime || !endTime) {
        return {
          ok: false,
          error: "startTime and endTime are required for available days.",
        };
      }

      if (endTime <= startTime) {
        return {
          ok: false,
          error: "endTime must be later than startTime for available days.",
        };
      }
    }

    normalized[day] = {
      dayOfWeek: day,
      isAvailable,
      startTime,
      endTime,
      timezone,
      notes,
    };
  }

  for (const day of DAYS) {
    if (!normalized[day]) {
      normalized[day] = {
        dayOfWeek: day,
        isAvailable: false,
        startTime: null,
        endTime: null,
        timezone: fallbackTimezone || "UTC",
        notes: "",
      };
    }
  }

  return { ok: true, week: normalized };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorRole = (actorContext.profile?.role || "").toLowerCase();
    if (!isTalentRole(actorRole)) {
      return NextResponse.json(
        {
          error: "Only teachers and students can manage service availability.",
        },
        { status: 403 },
      );
    }

    const timezone =
      actorContext.profile?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC";

    const { data, error } = await supabase
      .from("service_availability_weekly")
      .select(
        "day_of_week, is_available, start_time, end_time, timezone, notes",
      )
      .eq("tutor_id", actorContext.actor.id)
      .order("day_of_week", { ascending: true });

    if (error) {
      return createDbErrorResponse(
        error,
        "Failed to load service availability.",
      );
    }

    return NextResponse.json({
      availability: normalizeStoredWeek(data || [], timezone),
    });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to load service availability.");
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorRole = (actorContext.profile?.role || "").toLowerCase();
    if (!isTalentRole(actorRole)) {
      return NextResponse.json(
        {
          error: "Only teachers and students can update service availability.",
        },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const normalizedPayload = normalizePayloadWeek(
      body?.availability || [],
      body?.timezone || "UTC",
    );

    if (!normalizedPayload.ok) {
      return NextResponse.json(
        { error: normalizedPayload.error },
        { status: 400 },
      );
    }

    const rows = normalizedPayload.week.map((entry) => ({
      tutor_id: actorContext.actor.id,
      day_of_week: entry.dayOfWeek,
      is_available: entry.isAvailable,
      start_time: entry.startTime,
      end_time: entry.endTime,
      timezone: entry.timezone,
      notes: entry.notes || null,
    }));

    const { error: upsertError } = await supabase
      .from("service_availability_weekly")
      .upsert(rows, { onConflict: "tutor_id,day_of_week" });

    if (upsertError) {
      return createDbErrorResponse(
        upsertError,
        "Failed to update service availability.",
      );
    }

    const { data, error } = await supabase
      .from("service_availability_weekly")
      .select(
        "day_of_week, is_available, start_time, end_time, timezone, notes",
      )
      .eq("tutor_id", actorContext.actor.id)
      .order("day_of_week", { ascending: true });

    if (error) {
      return createDbErrorResponse(
        error,
        "Failed to reload service availability.",
      );
    }

    return NextResponse.json({
      success: true,
      availability: normalizeStoredWeek(data || [], "UTC"),
    });
  } catch (error) {
    return createDbErrorResponse(
      error,
      "Failed to update service availability.",
    );
  }
}
