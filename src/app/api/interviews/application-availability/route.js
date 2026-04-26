import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/features/admin/server/auth";
import { requireActorContext } from "@/lib/policies/policy-middleware";
import { isEmployerRole } from "@/lib/policies/access-control";
import {
  buildInterviewSchedulingSetupErrorResponsePayload,
  isInterviewSchedulingMissingTableError,
} from "@/lib/interviews/errors";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

function createDefaultWeek() {
  return DAYS.map((day) => ({
    dayOfWeek: day,
    isAvailable: false,
    startTime: null,
    endTime: null,
    timezone: "UTC",
    notes: "",
  }));
}

function buildAvailabilityMap(applicantIds, rows = []) {
  const map = {};

  for (const applicantId of applicantIds) {
    map[applicantId] = createDefaultWeek();
  }

  for (const row of rows) {
    const applicantId = row?.tutor_id;
    const day = Number(row?.day_of_week);
    if (!applicantId || !map[applicantId]) continue;
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;

    map[applicantId][day] = {
      dayOfWeek: day,
      isAvailable: Boolean(row?.is_available),
      startTime: row?.start_time || null,
      endTime: row?.end_time || null,
      timezone: row?.timezone || "UTC",
      notes: row?.notes || "",
    };
  }

  return map;
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

export async function GET(request) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorId = actorContext.actor.id;
    const actorRole = (actorContext.profile?.role || "").toLowerCase();

    if (!isEmployerRole(actorRole)) {
      return NextResponse.json(
        { error: "Only employers can access candidate availability." },
        { status: 403 },
      );
    }

    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required." },
        { status: 400 },
      );
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, organization_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) {
      return createDbErrorResponse(jobError, "Failed to verify job ownership.");
    }

    if (!job || job.organization_id !== actorId) {
      return NextResponse.json(
        {
          error:
            "You can only view availability for your own job applications.",
        },
        { status: 403 },
      );
    }

    const { data: applications, error: applicationError } = await supabase
      .from("applications")
      .select("id, applicant_id, status")
      .eq("job_id", jobId);

    if (applicationError) {
      return createDbErrorResponse(
        applicationError,
        "Failed to load job applications.",
      );
    }

    const applicantIds = Array.from(
      new Set(
        (applications || []).map((item) => item.applicant_id).filter(Boolean),
      ),
    );

    if (applicantIds.length === 0) {
      return NextResponse.json({ availabilityByApplicantId: {} });
    }

    const adminClient = createServiceRoleClient();
    const { data: rows, error: rowsError } = await adminClient
      .from("service_availability_weekly")
      .select(
        "tutor_id, day_of_week, is_available, start_time, end_time, timezone, notes",
      )
      .in("tutor_id", applicantIds)
      .order("day_of_week", { ascending: true });

    if (rowsError) {
      return createDbErrorResponse(
        rowsError,
        "Failed to load service availability.",
      );
    }

    const availabilityByApplicantId = buildAvailabilityMap(
      applicantIds,
      rows || [],
    );

    return NextResponse.json({ availabilityByApplicantId });
  } catch (error) {
    return createDbErrorResponse(
      error,
      "Failed to load candidate availability.",
    );
  }
}
