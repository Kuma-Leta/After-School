"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const TUTOR_ROLES = ["teacher", "student"];
const EMPLOYER_ROLES = ["school", "family", "ngo"];

const INTERVIEW_SETUP_MESSAGE =
  "Interview scheduling is not configured yet. Please run migration 20260422_interview_scheduling.sql and refresh the Supabase schema cache.";

function normalizeInterviewErrorMessage(payload, fallbackMessage) {
  const reason = payload?.reason || "";
  const error = payload?.error || "";
  if (
    reason === "interview_scheduling_not_configured" ||
    error.toLowerCase().includes("interview_availability_slots")
  ) {
    return INTERVIEW_SETUP_MESSAGE;
  }

  return error || fallbackMessage;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusPill(status) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "accepted" || normalized === "booked") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (normalized === "declined" || normalized === "cancelled") {
    return "bg-red-100 text-red-700";
  }
  if (normalized === "pending") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-gray-100 text-gray-700";
}

function handleDownloadIcs(calendarLinks) {
  if (!calendarLinks?.icsDataUrl) return;

  const link = document.createElement("a");
  link.href = calendarLinks.icsDataUrl;
  link.download = calendarLinks.icsFileName || "interview.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function CalendarActions({ calendarLinks }) {
  if (!calendarLinks?.googleCalendarUrl && !calendarLinks?.icsDataUrl) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {calendarLinks.googleCalendarUrl && (
        <a
          href={calendarLinks.googleCalendarUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          Add to Google Calendar
        </a>
      )}
      {calendarLinks.icsDataUrl && (
        <button
          type="button"
          onClick={() => handleDownloadIcs(calendarLinks)}
          className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          Download ICS Invite
        </button>
      )}
    </div>
  );
}

export default function SchedulePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const requestedApplicationId = searchParams.get("applicationId") || "";

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [requests, setRequests] = useState([]);

  const [candidates, setCandidates] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(true);
  const sentRequestsRef = useRef(null);

  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Addis_Ababa",
    notes: "",
  });

  const role = (profile?.role || "").toLowerCase();
  const isTutor = TUTOR_ROLES.includes(role);
  const isEmployer = EMPLOYER_ROLES.includes(role);

  const loadTutorData = useCallback(async () => {
    const requestResponse = await fetch("/api/interviews/requests", {
      cache: "no-store",
    });

    const requestPayload = await requestResponse.json().catch(() => ({}));
    if (!requestResponse.ok) {
      throw new Error(
        normalizeInterviewErrorMessage(
          requestPayload,
          "Failed to load interview requests.",
        ),
      );
    }

    setRequests(requestPayload.requests || []);
  }, []);

  const loadEmployerData = useCallback(async () => {
    const [candidateResponse, requestResponse] = await Promise.all([
      fetch("/api/interviews/school-candidates", { cache: "no-store" }),
      fetch("/api/interviews/requests", { cache: "no-store" }),
    ]);

    const candidatePayload = await candidateResponse.json().catch(() => ({}));
    if (!candidateResponse.ok) {
      throw new Error(
        normalizeInterviewErrorMessage(
          candidatePayload,
          "Failed to load candidates.",
        ),
      );
    }

    const requestPayload = await requestResponse.json().catch(() => ({}));
    if (!requestResponse.ok) {
      throw new Error(
        normalizeInterviewErrorMessage(
          requestPayload,
          "Failed to load interview requests.",
        ),
      );
    }

    const loadedCandidates = candidatePayload.candidates || [];
    setCandidates(loadedCandidates);
    setRequests(requestPayload.requests || []);

    const requestedCandidate = loadedCandidates.find(
      (candidate) => candidate.applicationId === requestedApplicationId,
    );
    const fallbackCandidate = loadedCandidates[0] || null;
    const nextCandidate = requestedCandidate || fallbackCandidate;

    if (loadedCandidates.length > 0) {
      setSelectedApplicationId((prev) => {
        if (
          prev &&
          !requestedApplicationId &&
          loadedCandidates.some((candidate) => candidate.applicationId === prev)
        ) {
          return prev;
        }

        return nextCandidate?.applicationId || "";
      });
    } else {
      setSelectedApplicationId("");
    }
  }, [requestedApplicationId]);

  const loadPageData = useCallback(async () => {
    if (!user || !profile) return;

    setPageLoading(true);
    setError("");

    try {
      if (isTutor) {
        await loadTutorData();
      } else if (isEmployer) {
        await loadEmployerData();
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load schedule data.");
    } finally {
      setPageLoading(false);
    }
  }, [user, profile, isTutor, isEmployer, loadTutorData, loadEmployerData]);

  useEffect(() => {
    if (!authLoading) {
      loadPageData();
    }
  }, [authLoading, loadPageData]);

  useEffect(() => {
    if (!isEmployer || !requestedApplicationId || candidates.length === 0) {
      return;
    }

    const requestedCandidate = candidates.find(
      (candidate) => candidate.applicationId === requestedApplicationId,
    );

    if (requestedCandidate) {
      setSelectedApplicationId(requestedCandidate.applicationId);
    }
  }, [isEmployer, requestedApplicationId, candidates]);

  const incomingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );

  const acceptedRequests = useMemo(
    () => requests.filter((request) => request.status === "accepted"),
    [requests],
  );

  const activeEmployerCandidate = useMemo(
    () =>
      candidates.find(
        (candidate) => candidate.applicationId === selectedApplicationId,
      ) || null,
    [candidates, selectedApplicationId],
  );

  const handleRespondToRequest = async (requestId, status) => {
    setError("");
    setNotice("");

    const response = await fetch("/api/interviews/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error || "Failed to update interview request.");
      return;
    }

    setNotice(`Interview request ${status}.`);
    await loadTutorData();
  };

  const handleCandidateSelection = (applicationId) => {
    setSelectedApplicationId(applicationId);
    setIsRequestFormOpen(true);
  };

  const handleRequestInterview = async () => {
    setError("");
    setNotice("");

    if (!selectedApplicationId) {
      setError("Please choose a candidate application first.");
      return;
    }

    if (!form.date || !form.startTime || !form.endTime) {
      setError("Date, start time, and end time are required.");
      return;
    }

    const startAt = new Date(`${form.date}T${form.startTime}`);
    const endAt = new Date(`${form.date}T${form.endTime}`);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setError("Please enter valid time values.");
      return;
    }

    const response = await fetch("/api/interviews/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: selectedApplicationId,
        proposedStartAt: startAt.toISOString(),
        proposedEndAt: endAt.toISOString(),
        timezone: form.timezone,
        notes: form.notes,
        message: requestMessage,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error || "Failed to request interview slot.");
      return;
    }

    setRequestMessage("");
    setForm((prev) => ({
      ...prev,
      date: "",
      startTime: "",
      endTime: "",
      notes: "",
    }));
    setIsRequestFormOpen(false);
    setNotice("Interview request sent successfully.");

    await loadEmployerData();
    requestAnimationFrame(() => {
      sentRequestsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-80 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1F1F1F]">
            Interview Scheduling
          </h1>
          <p className="text-gray-600 mt-1">
            {isTutor
              ? "Review interview proposals from employers and confirm the ones you want to take."
              : isEmployer
                ? "Propose interview times and let candidates accept or decline them."
                : "Scheduling is currently available for tutors and employers."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {notice}
          </div>
        )}

        {!isTutor && !isEmployer && (
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Role Not Supported Yet
            </h2>
            <p className="text-gray-600">
              This feature currently supports teacher/student availability and
              employer interview requests.
            </p>
          </div>
        )}

        {isTutor && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Incoming Interview Requests
              </h2>

              {incomingRequests.length === 0 ? (
                <p className="text-gray-600">No pending interview requests.</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {request.school?.full_name || "Employer"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700">
                        Slot: {formatDateTime(request.slot?.start_at)} -{" "}
                        {formatDateTime(request.slot?.end_at)}
                      </p>

                      {request.message && (
                        <p className="text-sm text-gray-600">
                          Message: {request.message}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRespondToRequest(request.id, "accepted")
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRespondToRequest(request.id, "declined")
                          }
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmed Interviews
              </h2>

              {acceptedRequests.length === 0 ? (
                <p className="text-gray-600">No confirmed interviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {acceptedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {request.school?.full_name || "Employer"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        Slot: {formatDateTime(request.slot?.start_at)} -{" "}
                        {formatDateTime(request.slot?.end_at)}
                      </p>
                      <CalendarActions calendarLinks={request.calendarLinks} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isEmployer && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 h-fit space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Create Interview Request
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate Application
                </label>
                <select
                  value={selectedApplicationId}
                  onChange={(event) =>
                    handleCandidateSelection(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {candidates.length === 0 && (
                    <option value="">No eligible candidates</option>
                  )}
                  {candidates.map((candidate) => (
                    <option
                      key={candidate.applicationId}
                      value={candidate.applicationId}
                    >
                      {candidate.candidateName} | {candidate.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              {activeEmployerCandidate && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Candidate:</span>{" "}
                    {activeEmployerCandidate.candidateName}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {activeEmployerCandidate.status}
                  </p>
                  <p>
                    <span className="font-medium">Job:</span>{" "}
                    {activeEmployerCandidate.jobTitle}
                  </p>
                  <Link
                    href={`/dashboard/messages?candidateId=${activeEmployerCandidate.candidateId}`}
                    className="mt-3 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Message Candidate
                  </Link>
                </div>
              )}

              {isRequestFormOpen ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          date: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            startTime: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            endTime: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={form.timezone}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          timezone: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interview Notes (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          notes: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="Interview format, meeting link, or preparation notes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Request Message (optional)
                    </label>
                    <textarea
                      rows={4}
                      value={requestMessage}
                      onChange={(event) =>
                        setRequestMessage(event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="Add details like interview format or preferred discussion points"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestInterview}
                    disabled={!selectedApplicationId}
                    className="w-full rounded-lg bg-[#FF1E00] px-4 py-2.5 text-white font-medium hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Interview Request
                  </button>
                </>
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <p className="font-medium">Interview request sent.</p>
                  <button
                    type="button"
                    onClick={() => setIsRequestFormOpen(true)}
                    className="mt-2 inline-flex rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    Send Another Request
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div
                ref={sentRequestsRef}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Sent Requests
                </h2>
                {requests.length === 0 ? (
                  <p className="text-gray-600">
                    No interview requests sent yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-gray-900">
                            {request.tutor?.full_name || "Tutor"} |{" "}
                            {request.job?.title || "Job"}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill(request.status)}`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(request.slot?.start_at)} -{" "}
                          {formatDateTime(request.slot?.end_at)}
                        </p>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-1">
                            Message: {request.message}
                          </p>
                        )}
                        <CalendarActions
                          calendarLinks={request.calendarLinks}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
