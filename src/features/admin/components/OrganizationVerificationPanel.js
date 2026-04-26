"use client";

import { useEffect, useState } from "react";

const statusOptions = ["pending", "verified", "rejected", "all"];

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function OrganizationVerificationPanel() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyOrgId, setBusyOrgId] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState({});

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/organizations?status=${status}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to load organizations.");
      }

      setItems(result.items || []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [status]);

  const updateVerification = async (organizationId, action) => {
    try {
      const rejectionReason = (rejectionNotes[organizationId] || "").trim();

      if (action === "reject" && !rejectionReason) {
        setError("Please provide a rejection reason before rejecting.");
        return;
      }

      setBusyOrgId(organizationId);
      setError("");

      const response = await fetch(
        `/api/admin/organizations/${organizationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action,
            rejectionReason,
          }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update verification status.",
        );
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === organizationId
            ? {
                ...item,
                ...result.item,
              }
            : item,
        ),
      );

      if (status === "pending") {
        setItems((prev) => prev.filter((item) => item.id !== organizationId));
      }
    } catch (updateError) {
      setError(updateError.message || "Failed to update verification status.");
    } finally {
      setBusyOrgId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Organization Verification
          </h2>
          <p className="mt-1 text-gray-600">
            Review school and NGO accounts, inspect supporting documents, and
            approve or reject onboarding.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All statuses"
                  : `${option.charAt(0).toUpperCase()}${option.slice(1)}`}
              </option>
            ))}
          </select>
          <button
            onClick={loadItems}
            className="h-10 rounded-lg bg-[#1F1F1F] px-4 text-sm font-medium text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {!loading && items.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No organizations found for this status.
          </div>
        )}

        {items.map((item) => {
          const docCount = item.documents?.length || 0;
          return (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.legal_name || item.org_name || "Unnamed organization"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Type: {(item.org_type || "-").toUpperCase()} | Status:{" "}
                    <span className="font-medium">
                      {item.verification_status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Contact:{" "}
                    {item.profile?.full_name || item.contact_person || "-"}
                    {item.profile?.email ? ` (${item.profile.email})` : ""}
                  </p>
                  <p className="text-sm text-gray-600">
                    Reg No: {item.registration_number || "-"} | Tax ID:{" "}
                    {item.tax_id || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Official Email: {item.official_email || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Website: {item.website || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Address: {item.address || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Representative: {item.authorized_representative_name || "-"}
                    {item.authorized_representative_role
                      ? ` (${item.authorized_representative_role})`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    Documents submitted:{" "}
                    {formatDate(item.documents_submitted_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Verified at: {formatDate(item.verified_at)}
                  </p>
                </div>

                <div className="w-full max-w-md space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-semibold text-gray-800">
                      Uploaded Documents ({docCount})
                    </p>
                    <div className="mt-2 space-y-2">
                      {docCount === 0 ? (
                        <p className="text-sm text-gray-600">
                          No documents uploaded yet.
                        </p>
                      ) : (
                        item.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between rounded border border-gray-200 bg-white px-2 py-1.5"
                          >
                            <div>
                              <p className="text-sm text-gray-800">
                                {doc.document_type.replace("_", " ")}
                              </p>
                              <p className="text-xs text-gray-500">
                                {doc.original_file_name || "Unnamed file"}
                              </p>
                            </div>
                            {doc.signed_url ? (
                              <a
                                href={doc.signed_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-blue-700 underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No link
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <textarea
                    value={rejectionNotes[item.id] || ""}
                    onChange={(event) =>
                      setRejectionNotes((prev) => ({
                        ...prev,
                        [item.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Optional note for approval; required reason for rejection"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busyOrgId === item.id}
                      onClick={() => updateVerification(item.id, "approve")}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      {busyOrgId === item.id ? "Updating..." : "Approve"}
                    </button>
                    <button
                      disabled={busyOrgId === item.id}
                      onClick={() => updateVerification(item.id, "reject")}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      {busyOrgId === item.id ? "Updating..." : "Reject"}
                    </button>
                  </div>

                  {item.verification_rejection_reason && (
                    <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                      Latest rejection reason:{" "}
                      {item.verification_rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
