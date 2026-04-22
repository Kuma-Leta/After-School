"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const TUTOR_ROLES = ["teacher", "student"];

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

function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function groupSlotsByDay(slots = []) {
  const groups = new Map();
  for (const slot of slots) {
    const key = (slot.start_at || "").slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(slot);
  }

  return Array.from(groups.entries())
    .map(([day, daySlots]) => ({
      day,
      daySlots: daySlots.sort(
        (a, b) => new Date(a.start_at) - new Date(b.start_at),
      ),
    }))
    .sort((a, b) => new Date(a.day) - new Date(b.day));
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

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [slots, setSlots] = useState([]);
  const [requests, setRequests] = useState([]);

  const [candidates, setCandidates] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [candidateSlots, setCandidateSlots] = useState([]);
  const [requestMessage, setRequestMessage] = useState("");

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
  const isSchool = role === "school";

  const loadTutorData = useCallback(async () => {
    const [slotResponse, requestResponse] = await Promise.all([
      fetch("/api/interviews/availability", { cache: "no-store" }),
      fetch("/api/interviews/requests", { cache: "no-store" }),
    ]);

    const slotPayload = await slotResponse.json().catch(() => ({}));
    if (!slotResponse.ok) {
      throw new Error(
        slotPayload.error || "Failed to load availability slots.",
      );
    }

    const requestPayload = await requestResponse.json().catch(() => ({}));
    if (!requestResponse.ok) {
      throw new Error(
        requestPayload.error || "Failed to load interview requests.",
      );
    }

    setSlots(slotPayload.slots || []);
    setRequests(requestPayload.requests || []);
  }, []);

  const loadSchoolData = useCallback(async () => {
    const [candidateResponse, requestResponse] = await Promise.all([
      fetch("/api/interviews/school-candidates", { cache: "no-store" }),
      fetch("/api/interviews/requests", { cache: "no-store" }),
    ]);

    const candidatePayload = await candidateResponse.json().catch(() => ({}));
    if (!candidateResponse.ok) {
      throw new Error(candidatePayload.error || "Failed to load candidates.");
    }

    const requestPayload = await requestResponse.json().catch(() => ({}));
    if (!requestResponse.ok) {
      throw new Error(
        requestPayload.error || "Failed to load interview requests.",
      );
    }

    const loadedCandidates = candidatePayload.candidates || [];
    setCandidates(loadedCandidates);
    setRequests(requestPayload.requests || []);

    if (loadedCandidates.length > 0) {
      setSelectedApplicationId(
        (prev) => prev || loadedCandidates[0].applicationId,
      );
      setSelectedTutorId((prev) => prev || loadedCandidates[0].candidateId);
    } else {
      setSelectedApplicationId("");
      setSelectedTutorId("");
      setCandidateSlots([]);
    }
  }, []);

  const loadCandidateSlots = useCallback(async (tutorId) => {
    if (!tutorId) {
      setCandidateSlots([]);
      return;
    }

    const response = await fetch(
      `/api/interviews/availability?tutorId=${encodeURIComponent(tutorId)}`,
      { cache: "no-store" },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        payload.error || "Failed to load candidate availability.",
      );
    }

    setCandidateSlots(payload.slots || []);
  }, []);

  const loadPageData = useCallback(async () => {
    if (!user || !profile) return;

    setPageLoading(true);
    setError("");

    try {
      if (isTutor) {
        await loadTutorData();
      } else if (isSchool) {
        await loadSchoolData();
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load schedule data.");
    } finally {
      setPageLoading(false);
    }
  }, [user, profile, isTutor, isSchool, loadTutorData, loadSchoolData]);

  useEffect(() => {
    if (!authLoading) {
      loadPageData();
    }
  }, [authLoading, loadPageData]);

  useEffect(() => {
    if (isSchool && selectedTutorId) {
      loadCandidateSlots(selectedTutorId).catch((slotError) => {
        setError(slotError.message || "Failed to load candidate availability.");
      });
    }
  }, [isSchool, selectedTutorId, loadCandidateSlots]);

  const openSlots = useMemo(
    () =>
      (slots || [])
        .filter((slot) => slot.status === "open")
        .filter((slot) => new Date(slot.start_at).getTime() > Date.now()),
    [slots],
  );

  const groupedOpenSlots = useMemo(
    () => groupSlotsByDay(openSlots),
    [openSlots],
  );

  const incomingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );

  const acceptedRequests = useMemo(
    () => requests.filter((request) => request.status === "accepted"),
    [requests],
  );

  const activeSchoolCandidate = useMemo(
    () =>
      candidates.find(
        (candidate) => candidate.applicationId === selectedApplicationId,
      ) || null,
    [candidates, selectedApplicationId],
  );

  const handleAddSlot = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

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

    const response = await fetch("/api/interviews/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        timezone: form.timezone,
        notes: form.notes,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Failed to create interview slot.");
      return;
    }

    setForm((prev) => ({ ...prev, notes: "", startTime: "", endTime: "" }));
    setNotice("Interview availability slot added.");
    await loadTutorData();
  };

  const handleCancelSlot = async (slotId) => {
    setError("");
    setNotice("");

    const response = await fetch(`/api/interviews/availability/${slotId}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error || "Failed to cancel availability slot.");
      return;
    }

    setNotice("Availability slot cancelled.");
    await loadTutorData();
  };

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
    const selected = candidates.find(
      (candidate) => candidate.applicationId === applicationId,
    );
    setSelectedTutorId(selected?.candidateId || "");
  };

  const handleRequestSlot = async (availabilitySlotId) => {
    setError("");
    setNotice("");

    if (!selectedApplicationId) {
      setError("Please choose a candidate application first.");
      return;
    }

    const response = await fetch("/api/interviews/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        availabilitySlotId,
        applicationId: selectedApplicationId,
        message: requestMessage,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error || "Failed to request interview slot.");
      return;
    }

    setRequestMessage("");
    setNotice("Interview slot requested successfully.");

    await Promise.all([loadSchoolData(), loadCandidateSlots(selectedTutorId)]);
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
              ? "Publish your interview availability and respond to school requests."
              : isSchool
                ? "Request interview slots from available tutors/teachers."
                : "Scheduling is currently available for tutors and schools."}
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

        {!isTutor && !isSchool && (
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Role Not Supported Yet
            </h2>
            <p className="text-gray-600">
              This feature currently supports teacher/student availability and
              school interview requests.
            </p>
          </div>
        )}

        {isTutor && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 h-fit">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Add Availability Slot
              </h2>
              <form onSubmit={handleAddSlot} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
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
                      required
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
                      required
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
                    Notes (optional)
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

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#FF1E00] px-4 py-2.5 text-white font-medium hover:bg-[#E01B00]"
                >
                  Add Slot
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Open Availability Calendar
                </h2>

                {groupedOpenSlots.length === 0 ? (
                  <p className="text-gray-600">No open interview slots yet.</p>
                ) : (
                  <div className="space-y-4">
                    {groupedOpenSlots.map((group) => (
                      <div
                        key={group.day}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h3 className="font-semibold text-gray-900 mb-3">
                          {formatDateLabel(group.day)}
                        </h3>
                        <div className="space-y-2">
                          {group.daySlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {formatDateTime(slot.start_at)} -{" "}
                                  {new Date(slot.end_at).toLocaleTimeString(
                                    [],
                                    { hour: "numeric", minute: "2-digit" },
                                  )}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {slot.timezone}
                                  {slot.notes ? ` | ${slot.notes}` : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCancelSlot(slot.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                              >
                                Cancel Slot
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Incoming Interview Requests
                </h2>

                {incomingRequests.length === 0 ? (
                  <p className="text-gray-600">
                    No pending interview requests.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {incomingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {request.school?.full_name || "School"}
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
                            {request.school?.full_name || "School"}
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
          </div>
        )}

        {isSchool && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 h-fit space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Request Interview Slot
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

              {activeSchoolCandidate && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Candidate:</span>{" "}
                    {activeSchoolCandidate.candidateName}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {activeSchoolCandidate.status}
                  </p>
                  <p>
                    <span className="font-medium">Job:</span>{" "}
                    {activeSchoolCandidate.jobTitle}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Message (optional)
                </label>
                <textarea
                  rows={4}
                  value={requestMessage}
                  onChange={(event) => setRequestMessage(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Add details like interview format or preferred discussion points"
                />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Slots
                </h2>

                {candidateSlots.length === 0 ? (
                  <p className="text-gray-600">
                    No open availability from this candidate yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {candidateSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(slot.start_at)} -{" "}
                            {new Date(slot.end_at).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {slot.timezone}
                            {slot.notes ? ` | ${slot.notes}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRequestSlot(slot.id)}
                          disabled={!selectedApplicationId}
                          className="rounded-lg bg-[#FF1E00] px-4 py-2 text-sm font-medium text-white hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Request Slot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
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
                        <CalendarActions calendarLinks={request.calendarLinks} />
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
