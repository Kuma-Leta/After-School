export const INTERVIEW_SCHEDULING_SETUP_MESSAGE =
  "Interview scheduling is not configured yet. Please run migration 20260422_interview_scheduling.sql and refresh the Supabase schema cache.";

export function isInterviewSchedulingMissingTableError(errorOrMessage) {
  const raw =
    typeof errorOrMessage === "string"
      ? errorOrMessage
      : errorOrMessage?.message || "";
  const message = raw.toLowerCase();

  const mentionsInterviewTable =
    message.includes("interview_availability_slots") ||
    message.includes("interview_slot_requests");

  return (
    mentionsInterviewTable &&
    (message.includes("could not find the table") ||
      message.includes("schema cache") ||
      message.includes("relation") ||
      message.includes("does not exist"))
  );
}

export function buildInterviewSchedulingSetupErrorResponsePayload() {
  return {
    error: INTERVIEW_SCHEDULING_SETUP_MESSAGE,
    reason: "interview_scheduling_not_configured",
    setupHint:
      "Run supabase/migrations/20260422_interview_scheduling.sql, then refresh schema cache.",
  };
}
