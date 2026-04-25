import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TALENT_ROLES, isEmployerRole } from "@/lib/policies/access-control";
import { requireActorContext } from "@/lib/policies/policy-middleware";
import { createServiceRoleClient } from "@/features/admin/server/auth";
import {
  buildInterviewSchedulingSetupErrorResponsePayload,
  isInterviewSchedulingMissingTableError,
} from "@/lib/interviews/errors";

const DEFAULT_SCHEDULE_LINK = "/dashboard/schedule";

function validateProposedInterviewWindow(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: "Invalid proposed interview date or time." };
  }

  if (end <= start) {
    return {
      ok: false,
      error: "The interview end time must be later than the start time.",
    };
  }

  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes < 20 || durationMinutes > 240) {
    return {
      ok: false,
      error: "Interview proposals must be between 20 and 240 minutes.",
    };
  }

  if (start.getTime() <= Date.now()) {
    return { ok: false, error: "Interview proposals must be in the future." };
  }

  return {
    ok: true,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
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

function formatCalendarDate(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value) {
  return (value || "")
    .toString()
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildCalendarLinks({
  title,
  description,
  startAt,
  endAt,
  location,
  uid,
}) {
  const start = formatCalendarDate(startAt);
  const end = formatCalendarDate(endAt);
  if (!start || !end) return null;

  const eventTitle = title || "Interview";
  const eventDescription = description || "Interview scheduled via AfterSchool";
  const eventLocation = location || "AfterSchool";

  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle,
    dates: `${start}/${end}`,
    details: eventDescription,
    location: eventLocation,
  });

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AfterSchool//Interview Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid || `afterschool-${start}`}`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(eventTitle)}`,
    `DESCRIPTION:${escapeIcsText(eventDescription)}`,
    `LOCATION:${escapeIcsText(eventLocation)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    googleCalendarUrl: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    icsDataUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`,
    icsFileName: `afterschool-interview-${start}.ics`,
  };
}

async function sendInterviewNotification({
  recipientId,
  title,
  message,
  metadata = {},
  link = DEFAULT_SCHEDULE_LINK,
  type = "event",
}) {
  if (!recipientId) return;

  try {
    const adminClient = createServiceRoleClient();
    await adminClient.from("notifications").insert({
      user_id: recipientId,
      title,
      message,
      type,
      metadata,
      link,
      read: false,
    });
  } catch (error) {
    console.error("Failed to create interview notification:", error);
  }
}

function isTalentRole(role) {
  return TALENT_ROLES.includes((role || "").toLowerCase());
}

async function loadProfiles(supabase, ids = []) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message || "Failed to load profiles.");
  }

  return data || [];
}

async function mapRequestsWithDetails(supabase, rows = []) {
  if (!rows.length) return [];

  const slotIds = Array.from(
    new Set(rows.map((r) => r.availability_slot_id).filter(Boolean)),
  );
  const applicationIds = Array.from(
    new Set(rows.map((r) => r.application_id).filter(Boolean)),
  );
  const profileIds = Array.from(
    new Set(
      rows.flatMap((r) => [r.tutor_id, r.requester_school_id]).filter(Boolean),
    ),
  );

  const [
    { data: slots, error: slotError },
    { data: applications, error: appError },
    profiles,
  ] = await Promise.all([
    supabase
      .from("interview_availability_slots")
      .select("id, start_at, end_at, timezone, notes, status")
      .in("id", slotIds),
    supabase
      .from("applications")
      .select("id, status, job_id, applicant_id")
      .in("id", applicationIds),
    loadProfiles(supabase, profileIds),
  ]);

  if (slotError) {
    throw new Error(slotError.message || "Failed to load interview slots.");
  }

  if (appError) {
    throw new Error(appError.message || "Failed to load applications.");
  }

  const jobIds = Array.from(
    new Set((applications || []).map((a) => a.job_id).filter(Boolean)),
  );
  let jobs = [];
  if (jobIds.length > 0) {
    const { data: jobRows, error: jobError } = await supabase
      .from("jobs")
      .select("id, title")
      .in("id", jobIds);

    if (jobError) {
      throw new Error(jobError.message || "Failed to load jobs.");
    }

    jobs = jobRows || [];
  }

  const slotMap = new Map((slots || []).map((slot) => [slot.id, slot]));
  const appMap = new Map((applications || []).map((app) => [app.id, app]));
  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile]),
  );
  const jobMap = new Map((jobs || []).map((job) => [job.id, job]));

  return rows.map((request) => {
    const slot = slotMap.get(request.availability_slot_id) || null;
    const application = appMap.get(request.application_id) || null;
    const tutor = profileMap.get(request.tutor_id) || null;
    const school = profileMap.get(request.requester_school_id) || null;
    const job = application ? jobMap.get(application.job_id) || null : null;
    const interviewTitle = `Interview: ${job?.title || "AfterSchool Opportunity"}`;
    const interviewDescription = `Interview between ${school?.full_name || "School"} and ${tutor?.full_name || "Tutor"}.`;
    const calendarLinks =
      request.status === "accepted" && slot?.start_at && slot?.end_at
        ? buildCalendarLinks({
            title: interviewTitle,
            description: interviewDescription,
            startAt: slot.start_at,
            endAt: slot.end_at,
            location: slot.timezone || "Online",
            uid: request.id,
          })
        : null;

    return {
      ...request,
      slot,
      tutor,
      school,
      application,
      job,
      calendarLinks,
    };
  });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorId = actorContext.actor.id;
    const actorRole = (actorContext.profile?.role || "").toLowerCase();

    let query = supabase
      .from("interview_slot_requests")
      .select(
        "id, availability_slot_id, application_id, tutor_id, requester_school_id, status, message, created_at, updated_at, responded_at",
      )
      .order("created_at", { ascending: false });

    if (isEmployerRole(actorRole)) {
      query = query.eq("requester_school_id", actorId);
    } else if (isTalentRole(actorRole)) {
      query = query.eq("tutor_id", actorId);
    } else {
      return NextResponse.json(
        { error: "You do not have access to interview slot requests." },
        { status: 403 },
      );
    }

    const { data, error } = await query;
    if (error) {
      return createDbErrorResponse(error, "Failed to load interview requests.");
    }

    const requests = await mapRequestsWithDetails(supabase, data || []);
    return NextResponse.json({ requests });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to load interview requests.");
  }
}

export async function POST(request) {
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
        { error: "Only employers can request interview slots." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const availabilitySlotId = body?.availabilitySlotId;
    const applicationId = body?.applicationId;
    const message = (body?.message || "").toString().trim().slice(0, 500);
    const proposedStartAt = body?.proposedStartAt;
    const proposedEndAt = body?.proposedEndAt;
    const timezone = (body?.timezone || "UTC").toString().slice(0, 80);
    const notes = (body?.notes || "").toString().trim().slice(0, 500);

    if (!applicationId || (!availabilitySlotId && !proposedStartAt)) {
      return NextResponse.json(
        {
          error:
            "applicationId and either availabilitySlotId or a proposed interview time are required.",
        },
        { status: 400 },
      );
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, job_id, applicant_id, status")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError) {
      return createDbErrorResponse(appError, "Failed to load application.");
    }

    if (!["shortlisted", "interviewing"].includes(application.status)) {
      return NextResponse.json(
        {
          error:
            "Interview slots can only be requested for shortlisted or interviewing applications.",
        },
        { status: 409 },
      );
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, organization_id")
      .eq("id", application.job_id)
      .maybeSingle();

    if (jobError) {
      return createDbErrorResponse(jobError, "Failed to load related job.");
    }

    if (!job || job.organization_id !== actorId) {
      return NextResponse.json(
        {
          error:
            "You can only request interview slots for applications on your own jobs.",
        },
        { status: 403 },
      );
    }

    let resolvedAvailabilitySlotId = availabilitySlotId || null;
    let slot = null;

    if (resolvedAvailabilitySlotId) {
      const { data: loadedSlot, error: slotError } = await supabase
        .from("interview_availability_slots")
        .select("id, tutor_id, start_at, status")
        .eq("id", resolvedAvailabilitySlotId)
        .maybeSingle();

      if (slotError) {
        return createDbErrorResponse(
          slotError,
          "Failed to load availability slot.",
        );
      }

      if (!loadedSlot || loadedSlot.status !== "open") {
        return NextResponse.json(
          { error: "This availability slot is no longer open." },
          { status: 409 },
        );
      }

      if (new Date(loadedSlot.start_at).getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "Past interview slots cannot be requested." },
          { status: 400 },
        );
      }

      if (application.applicant_id !== loadedSlot.tutor_id) {
        return NextResponse.json(
          {
            error:
              "Application does not belong to the selected tutor for this slot.",
          },
          { status: 400 },
        );
      }

      slot = loadedSlot;
    } else {
      const proposedWindow = validateProposedInterviewWindow(
        proposedStartAt,
        proposedEndAt,
      );

      if (!proposedWindow.ok) {
        return NextResponse.json(
          { error: proposedWindow.error },
          { status: 400 },
        );
      }

      const adminClient = createServiceRoleClient();
      const { data: createdSlot, error: createSlotError } = await adminClient
        .from("interview_availability_slots")
        .insert({
          tutor_id: application.applicant_id,
          start_at: proposedWindow.startIso,
          end_at: proposedWindow.endIso,
          timezone,
          notes,
          status: "open",
        })
        .select("id, tutor_id, start_at, end_at, timezone, notes, status")
        .single();

      if (createSlotError) {
        return createDbErrorResponse(
          createSlotError,
          "Failed to create interview proposal.",
        );
      }

      resolvedAvailabilitySlotId = createdSlot.id;
      slot = createdSlot;
    }

    const { data: existing, error: existingError } = await supabase
      .from("interview_slot_requests")
      .select("id")
      .eq("availability_slot_id", resolvedAvailabilitySlotId)
      .in("status", ["pending", "accepted"])
      .limit(1);

    if (existingError) {
      return createDbErrorResponse(
        existingError,
        "Failed to verify existing slot requests.",
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "This slot already has an active request." },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from("interview_slot_requests")
      .insert({
        availability_slot_id: resolvedAvailabilitySlotId,
        application_id: applicationId,
        tutor_id: application.applicant_id,
        requester_school_id: actorId,
        status: "pending",
        message,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select(
        "id, availability_slot_id, application_id, tutor_id, requester_school_id, status, message, created_at, updated_at, responded_at",
      )
      .single();

    if (insertError) {
      return createDbErrorResponse(
        insertError,
        "Failed to create interview request.",
      );
    }

    const [detailedRequest] = await mapRequestsWithDetails(supabase, [
      inserted,
    ]);

    await sendInterviewNotification({
      recipientId: inserted.tutor_id,
      title: "New Interview Slot Request",
      message: `${detailedRequest?.school?.full_name || "A school"} requested an interview slot for ${detailedRequest?.job?.title || "your application"}.`,
      metadata: {
        requestId: inserted.id,
        applicationId: inserted.application_id,
        availabilitySlotId: inserted.availability_slot_id,
        status: inserted.status,
        slotStartAt: detailedRequest?.slot?.start_at || slot?.start_at || null,
        slotEndAt: detailedRequest?.slot?.end_at || slot?.end_at || null,
      },
    });

    return NextResponse.json({
      success: true,
      request: detailedRequest || inserted,
    });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to create interview request.");
  }
}

export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorId = actorContext.actor.id;
    const actorRole = (actorContext.profile?.role || "").toLowerCase();
    if (!isTalentRole(actorRole)) {
      return NextResponse.json(
        { error: "Only tutors can respond to interview requests." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestId = body?.requestId;
    const status = (body?.status || "").toString().toLowerCase();

    if (!requestId || !["accepted", "declined"].includes(status)) {
      return NextResponse.json(
        { error: "requestId and a valid status are required." },
        { status: 400 },
      );
    }

    const { data: slotRequest, error: requestError } = await supabase
      .from("interview_slot_requests")
      .select("id, tutor_id, availability_slot_id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (requestError) {
      return createDbErrorResponse(requestError, "Failed to load request.");
    }

    if (!slotRequest || slotRequest.tutor_id !== actorId) {
      return NextResponse.json(
        { error: "Request not found." },
        { status: 404 },
      );
    }

    if (slotRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be updated." },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();
    const { data: updatedRequest, error: updateError } = await supabase
      .from("interview_slot_requests")
      .update({
        status,
        updated_at: nowIso,
        responded_at: nowIso,
      })
      .eq("id", requestId)
      .eq("tutor_id", actorId)
      .select(
        "id, availability_slot_id, application_id, tutor_id, requester_school_id, status, message, created_at, updated_at, responded_at",
      )
      .single();

    if (updateError) {
      return createDbErrorResponse(
        updateError,
        "Failed to update interview request.",
      );
    }

    if (status === "accepted") {
      const { error: slotUpdateError } = await supabase
        .from("interview_availability_slots")
        .update({ status: "booked", updated_at: nowIso })
        .eq("id", slotRequest.availability_slot_id)
        .eq("tutor_id", actorId);

      if (slotUpdateError) {
        return createDbErrorResponse(
          slotUpdateError,
          "Request accepted but failed to update slot status.",
        );
      }

      await supabase
        .from("interview_slot_requests")
        .update({
          status: "declined",
          updated_at: nowIso,
          responded_at: nowIso,
        })
        .eq("availability_slot_id", slotRequest.availability_slot_id)
        .eq("status", "pending")
        .neq("id", requestId);
    }

    const [detailedRequest] = await mapRequestsWithDetails(supabase, [
      updatedRequest,
    ]);
    const decisionLabel = status === "accepted" ? "accepted" : "declined";
    const decisionTitle =
      status === "accepted"
        ? "Interview Request Accepted"
        : "Interview Request Declined";

    await sendInterviewNotification({
      recipientId: updatedRequest.requester_school_id,
      title: decisionTitle,
      message: `${detailedRequest?.tutor?.full_name || "Tutor"} has ${decisionLabel} your interview request for ${detailedRequest?.job?.title || "the selected role"}.`,
      metadata: {
        requestId: updatedRequest.id,
        applicationId: updatedRequest.application_id,
        availabilitySlotId: updatedRequest.availability_slot_id,
        status: updatedRequest.status,
        slotStartAt: detailedRequest?.slot?.start_at || null,
        slotEndAt: detailedRequest?.slot?.end_at || null,
        calendarLinks: detailedRequest?.calendarLinks || null,
      },
    });

    return NextResponse.json({
      success: true,
      request: detailedRequest || updatedRequest,
    });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to update interview request.");
  }
}
