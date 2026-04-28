"use client";

import { useMemo, useState } from "react";

export const CANDIDATE_ENTRY_CONFIG = {
  education: {
    title: "Education",
    entryLabel: "Education Entry",
    buttonLabel: "Add Education",
    fieldName: "education_entries",
    emptyMessage:
      "Add schools, degrees, or training programs you want employers to see.",
  },
  certificate: {
    title: "Certificates",
    entryLabel: "Certificate",
    buttonLabel: "Add Certificate",
    fieldName: "certificate_entries",
    emptyMessage:
      "Add certifications, licenses, or awards that support your profile.",
  },
  experience: {
    title: "Experience",
    entryLabel: "Experience Entry",
    buttonLabel: "Add Experience",
    fieldName: "experience_entries",
    emptyMessage:
      "Add the work, tutoring, or internship experience that shows your background.",
  },
};

export function normalizeCandidateCollections(roleDetails) {
  return {
    ...(roleDetails || {}),
    education_entries: Array.isArray(roleDetails?.education_entries)
      ? roleDetails.education_entries
      : [],
    certificate_entries: Array.isArray(roleDetails?.certificate_entries)
      ? roleDetails.certificate_entries
      : [],
    experience_entries: Array.isArray(roleDetails?.experience_entries)
      ? roleDetails.experience_entries
      : [],
  };
}

export function createEmptyCandidateEntry(type) {
  switch (type) {
    case "education":
      return {
        school: "",
        degree: "",
        field_of_study: "",
        start_year: "",
        end_year: "",
        current: false,
        description: "",
      };
    case "certificate":
      return {
        name: "",
        issuer: "",
        issue_date: "",
        expiration_date: "",
        credential_id: "",
      };
    case "experience":
      return {
        title: "",
        organization: "",
        start_date: "",
        end_date: "",
        current: false,
        description: "",
      };
    default:
      return {};
  }
}

export function validateCandidateEntry(type, entry) {
  switch (type) {
    case "education":
      if (!entry.school?.trim() || !entry.degree?.trim()) {
        return "Education requires a school and degree.";
      }
      return null;
    case "certificate":
      if (!entry.name?.trim() || !entry.issuer?.trim()) {
        return "Certificate requires a name and issuer.";
      }
      return null;
    case "experience":
      if (!entry.title?.trim() || !entry.organization?.trim()) {
        return "Experience requires a title and organization.";
      }
      return null;
    default:
      return "Invalid entry type.";
  }
}

function formatDisplayDate(value, options) {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString("en-US", options);
  }
  return value;
}

function formatEducationRange(entry) {
  const start = entry?.start_year || "";
  const end = entry?.current ? "Present" : entry?.end_year || "";
  if (!start && !end) return "Dates not specified";
  if (!start) return end;
  if (!end) return start;
  return `${start} - ${end}`;
}

function formatExperienceRange(entry) {
  const start = formatDisplayDate(entry?.start_date, {
    year: "numeric",
    month: "short",
  });
  const end = entry?.current
    ? "Present"
    : formatDisplayDate(entry?.end_date, {
        year: "numeric",
        month: "short",
      });

  if (!start && !end) return "Dates not specified";
  if (!start) return end;
  if (!end) return start;
  return `${start} - ${end}`;
}

function formatCertificateRange(entry) {
  const issued = formatDisplayDate(entry?.issue_date, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const expires = formatDisplayDate(entry?.expiration_date, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (issued && expires) {
    return `Issued ${issued} - Expires ${expires}`;
  }
  if (issued) {
    return `Issued ${issued}`;
  }
  if (expires) {
    return `Expires ${expires}`;
  }
  return "Date not specified";
}

export default function CandidatePortfolioSection({
  roleDetails,
  canEdit = false,
  title = "Candidate Portfolio",
  subtitle,
  onAddEntry,
  saving = false,
}) {
  const normalizedRoleDetails = useMemo(
    () => normalizeCandidateCollections(roleDetails || {}),
    [roleDetails],
  );
  const [activeEntryType, setActiveEntryType] = useState(null);
  const [entryDraft, setEntryDraft] = useState(null);
  const [localError, setLocalError] = useState("");

  const handleOpenEntryComposer = (type) => {
    setLocalError("");
    setActiveEntryType(type);
    setEntryDraft(createEmptyCandidateEntry(type));
  };

  const handleCloseEntryComposer = () => {
    setActiveEntryType(null);
    setEntryDraft(null);
    setLocalError("");
  };

  const handleEntryDraftChange = (event) => {
    const { name, value, type, checked } = event.target;

    setEntryDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;

      const nextValue = type === "checkbox" ? checked : value;
      const nextDraft = {
        ...currentDraft,
        [name]: nextValue,
      };

      if (name === "current" && checked) {
        if (activeEntryType === "education") {
          nextDraft.end_year = "";
        }
        if (activeEntryType === "experience") {
          nextDraft.end_date = "";
        }
      }

      return nextDraft;
    });
  };

  const handleSaveEntry = async () => {
    if (!activeEntryType || !entryDraft || typeof onAddEntry !== "function") {
      return;
    }

    const validationError = validateCandidateEntry(activeEntryType, entryDraft);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError("");
    try {
      await onAddEntry(activeEntryType, entryDraft);
      handleCloseEntryComposer();
    } catch (error) {
      setLocalError(error?.message || "Failed to save entry.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-[#1F1F1F]">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <p className="text-sm text-gray-500">
          These details become part of the candidate profile.
        </p>
      </div>

      {localError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {localError}
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(CANDIDATE_ENTRY_CONFIG).map(([type, config]) => {
          const entries = normalizedRoleDetails?.[config.fieldName] || [];

          return (
            <section
              key={type}
              className="border border-gray-200 rounded-2xl p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-[#1F1F1F]">
                    {config.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {config.emptyMessage}
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleOpenEntryComposer(type)}
                    className="inline-flex items-center justify-center rounded-lg bg-[#FF1E00] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E01B00]"
                  >
                    {config.buttonLabel}
                  </button>
                )}
              </div>

              {entries.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id || JSON.stringify(entry)}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      {type === "education" && (
                        <>
                          <p className="font-semibold text-[#1F1F1F]">
                            {entry.degree}
                            {entry.field_of_study
                              ? ` in ${entry.field_of_study}`
                              : ""}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {entry.school}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mt-2">
                            {formatEducationRange(entry)}
                          </p>
                          {entry.description && (
                            <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">
                              {entry.description}
                            </p>
                          )}
                        </>
                      )}

                      {type === "certificate" && (
                        <>
                          <p className="font-semibold text-[#1F1F1F]">
                            {entry.name}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {entry.issuer}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mt-2">
                            {formatCertificateRange(entry)}
                          </p>
                          {entry.credential_id && (
                            <p className="text-sm text-gray-600 mt-3">
                              Credential ID: {entry.credential_id}
                            </p>
                          )}
                        </>
                      )}

                      {type === "experience" && (
                        <>
                          <p className="font-semibold text-[#1F1F1F]">
                            {entry.title}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {entry.organization}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mt-2">
                            {formatExperienceRange(entry)}
                          </p>
                          {entry.description && (
                            <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">
                              {entry.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                  Nothing added yet.
                </div>
              )}

              {canEdit && activeEntryType === type && entryDraft && (
                <div className="mt-5 rounded-2xl border border-[#FF1E00]/20 bg-[#FFF7F4] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-base font-semibold text-[#1F1F1F]">
                      New {config.entryLabel}
                    </h5>
                    <button
                      type="button"
                      onClick={handleCloseEntryComposer}
                      className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>

                  {type === "education" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          School or Institution
                        </label>
                        <input
                          type="text"
                          name="school"
                          value={entryDraft.school}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Degree or Program
                        </label>
                        <input
                          type="text"
                          name="degree"
                          value={entryDraft.degree}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          name="field_of_study"
                          value={entryDraft.field_of_study}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Year
                        </label>
                        <input
                          type="number"
                          name="start_year"
                          value={entryDraft.start_year}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Year
                        </label>
                        <input
                          type="number"
                          name="end_year"
                          value={entryDraft.end_year}
                          onChange={handleEntryDraftChange}
                          disabled={entryDraft.current}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20 disabled:bg-gray-100"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 md:self-end">
                        <input
                          type="checkbox"
                          name="current"
                          checked={entryDraft.current}
                          onChange={handleEntryDraftChange}
                          className="h-4 w-4 rounded border-gray-300 text-[#FF1E00] focus:ring-[#FF1E00]"
                        />
                        I am currently studying here
                      </label>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          name="description"
                          value={entryDraft.description}
                          onChange={handleEntryDraftChange}
                          rows="3"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                    </div>
                  )}

                  {type === "certificate" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Certificate Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={entryDraft.name}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issuer
                        </label>
                        <input
                          type="text"
                          name="issuer"
                          value={entryDraft.issuer}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issue Date
                        </label>
                        <input
                          type="date"
                          name="issue_date"
                          value={entryDraft.issue_date}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiration Date
                        </label>
                        <input
                          type="date"
                          name="expiration_date"
                          value={entryDraft.expiration_date}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Credential ID
                        </label>
                        <input
                          type="text"
                          name="credential_id"
                          value={entryDraft.credential_id}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                    </div>
                  )}

                  {type === "experience" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={entryDraft.title}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization
                        </label>
                        <input
                          type="text"
                          name="organization"
                          value={entryDraft.organization}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={entryDraft.start_date}
                          onChange={handleEntryDraftChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="end_date"
                          value={entryDraft.end_date}
                          onChange={handleEntryDraftChange}
                          disabled={entryDraft.current}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20 disabled:bg-gray-100"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 md:self-end">
                        <input
                          type="checkbox"
                          name="current"
                          checked={entryDraft.current}
                          onChange={handleEntryDraftChange}
                          className="h-4 w-4 rounded border-gray-300 text-[#FF1E00] focus:ring-[#FF1E00]"
                        />
                        I still work here
                      </label>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Summary
                        </label>
                        <textarea
                          name="description"
                          value={entryDraft.description}
                          onChange={handleEntryDraftChange}
                          rows="4"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCloseEntryComposer}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEntry}
                      disabled={saving}
                      className="rounded-lg bg-[#FF1E00] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E01B00] disabled:cursor-not-allowed disabled:bg-[#FF1E00]/60"
                    >
                      {saving ? "Saving..." : `Save ${config.entryLabel}`}
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
