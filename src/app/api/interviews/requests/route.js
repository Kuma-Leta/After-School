import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TALENT_ROLES } from "@/lib/policies/access-control";
import { requireActorContext } from "@/lib/policies/policy-middleware";
import { createServiceRoleClient } from "@/features/admin/server/auth";

const DEFAULT_SCHEDULE_LINK = "/dashboard/schedule";

function formatCalendarDate(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
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

    if (actorRole === "school") {
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
      return NextResponse.json(
        { error: error.message || "Failed to load interview requests." },
        { status: 500 },
      );
    }

    const requests = await mapRequestsWithDetails(supabase, data || []);
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load interview requests." },
      { status: 500 },
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

    const actorId = actorContext.actor.id;
    const actorRole = (actorContext.profile?.role || "").toLowerCase();

    if (actorRole !== "school") {
      return NextResponse.json(
        { error: "Only schools can request interview slots." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const availabilitySlotId = body?.availabilitySlotId;
    const applicationId = body?.applicationId;
    const message = (body?.message || "").toString().trim().slice(0, 500);

    if (!availabilitySlotId || !applicationId) {
      return NextResponse.json(
        { error: "availabilitySlotId and applicationId are required." },
        { status: 400 },
      );
    }

    const { data: slot, error: slotError } = await supabase
      .from("interview_availability_slots")
      .select("id, tutor_id, start_at, status")
      .eq("id", availabilitySlotId)
      .maybeSingle();

    if (slotError) {
      return NextResponse.json(
        { error: slotError.message || "Failed to load availability slot." },
        { status: 500 },
      );
    }

    if (!slot || slot.status !== "open") {
      return NextResponse.json(
        { error: "This availability slot is no longer open." },
        { status: 409 },
      );
    }

    if (new Date(slot.start_at).getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Past interview slots cannot be requested." },
        { status: 400 },
      );
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, job_id, applicant_id, status")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError) {
      return NextResponse.json(
        { error: appError.message || "Failed to load application." },
        { status: 500 },
      );
    }

    if (!application || application.applicant_id !== slot.tutor_id) {
      return NextResponse.json(
        {
          error:
            "Application does not belong to the selected tutor for this slot.",
        },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: jobError.message || "Failed to load related job." },
        { status: 500 },
      );
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

    const { data: existing, error: existingError } = await supabase
      .from("interview_slot_requests")
      .select("id")
      .eq("availability_slot_id", availabilitySlotId)
      .in("status", ["pending", "accepted"])
      .limit(1);

    if (existingError) {
      return NextResponse.json(
        {
          error:
            existingError.message || "Failed to verify existing slot requests.",
        },
        { status: 500 },
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
        availability_slot_id: availabilitySlotId,
        application_id: applicationId,
        tutor_id: slot.tutor_id,
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
      return NextResponse.json(
        { error: insertError.message || "Failed to create interview request." },
        { status: 500 },
      );
    }

    const [detailedRequest] = await mapRequestsWithDetails(supabase, [inserted]);

    await sendInterviewNotification({
      recipientId: inserted.tutor_id,
      title: "New Interview Slot Request",
      message: `${detailedRequest?.school?.full_name || "A school"} requested an interview slot for ${detailedRequest?.job?.title || "your application"}.`,
      metadata: {
        requestId: inserted.id,
        applicationId: inserted.application_id,
        availabilitySlotId: inserted.availability_slot_id,
        status: inserted.status,
        slotStartAt: detailedRequest?.slot?.start_at || null,
        slotEndAt: detailedRequest?.slot?.end_at || null,
      },
    });

    return NextResponse.json({
      success: true,
      request: detailedRequest || inserted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create interview request." },
      { status: 500 },
    );
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
      return NextResponse.json(
        { error: requestError.message || "Failed to load request." },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: updateError.message || "Failed to update interview request." },
        { status: 500 },
      );
    }

    if (status === "accepted") {
      const { error: slotUpdateError } = await supabase
        .from("interview_availability_slots")
        .update({ status: "booked", updated_at: nowIso })
        .eq("id", slotRequest.availability_slot_id)
        .eq("tutor_id", actorId);

      if (slotUpdateError) {
        return NextResponse.json(
          {
            error:
              slotUpdateError.message ||
              "Request accepted but failed to update slot status.",
          },
          { status: 500 },
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

    const [detailedRequest] = await mapRequestsWithDetails(supabase, [updatedRequest]);
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
    return NextResponse.json(
      { error: error.message || "Failed to update interview request." },
      { status: 500 },
    );
  }
}
