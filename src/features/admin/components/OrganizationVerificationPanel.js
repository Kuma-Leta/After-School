"use client";

import { useEffect, useState } from "react";

const statusOptions = ["pending", "verified", "rejected", "all"];

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function generateSecurePassword(length = 16) {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += charset[randomValues[index] % charset.length];
  }

  return result;
}

export default function OrganizationVerificationPanel() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [busyOrgId, setBusyOrgId] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [createForm, setCreateForm] = useState({
    role: "school",
    full_name: "",
    email: "",
    password: "",
    phone: "",
    organization_name: "",
    contact_person: "",
    address: "",
    website: "",
    legal_name: "",
    registration_number: "",
    tax_id: "",
    official_email: "",
    authorized_representative_name: "",
    authorized_representative_role: "",
    verification_status: "verified",
    force_password_reset: true,
  });

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

  const handleCreateInputChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const createOrganizationAccount = async () => {
    try {
      setCreatingAccount(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(createForm),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create account.");
      }

      setSuccessMessage(
        `Created ${createForm.role} account for ${result.item?.email || createForm.email}.`,
      );
      setCreateForm((prev) => ({
        ...prev,
        full_name: "",
        email: "",
        password: "",
        phone: "",
        organization_name: "",
        contact_person: "",
        address: "",
        website: "",
        legal_name: "",
        registration_number: "",
        tax_id: "",
        official_email: "",
        authorized_representative_name: "",
        authorized_representative_role: "",
        force_password_reset: true,
      }));

      setStatus("all");
      loadItems();
    } catch (createError) {
      setError(createError.message || "Failed to create account.");
    } finally {
      setCreatingAccount(false);
    }
  };

  const applyGeneratedPassword = async () => {
    const password = generateSecurePassword();

    setCreateForm((prev) => ({
      ...prev,
      password,
    }));

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(password);
        setSuccessMessage("Generated password copied to clipboard.");
      } else {
        setSuccessMessage("Generated password applied to the form.");
      }
    } catch {
      setSuccessMessage("Generated password applied to the form.");
    }
  };

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
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Create Organization Or Family Account
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Admin can onboard school, NGO, and family accounts directly with all
            required details.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm text-gray-700">
            <span>Role</span>
            <select
              name="role"
              value={createForm.role}
              onChange={handleCreateInputChange}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            >
              <option value="school">School</option>
              <option value="ngo">NGO</option>
              <option value="family">Family</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span>Primary Contact Full Name</span>
            <input
              name="full_name"
              value={createForm.full_name}
              onChange={handleCreateInputChange}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={createForm.email}
              onChange={handleCreateInputChange}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span>Initial Password</span>
            <div className="flex gap-2">
              <input
                type="text"
                name="password"
                value={createForm.password}
                onChange={handleCreateInputChange}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
              <button
                type="button"
                onClick={applyGeneratedPassword}
                className="h-10 whitespace-nowrap rounded-lg border border-gray-300 bg-gray-100 px-3 text-xs font-semibold text-gray-800"
              >
                Generate
              </button>
            </div>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span>Phone</span>
            <input
              name="phone"
              value={createForm.phone}
              onChange={handleCreateInputChange}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span>Organization/Family Name</span>
            <input
              name="organization_name"
              value={createForm.organization_name}
              onChange={handleCreateInputChange}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700 md:col-span-2">
            <span>Address</span>
            <input
              name="address"
              value={createForm.address}
              onChange={handleCreateInputChange}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span>Website (optional)</span>
            <input
              name="website"
              value={createForm.website}
              onChange={handleCreateInputChange}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span>Contact Person</span>
            <input
              name="contact_person"
              value={createForm.contact_person}
              onChange={handleCreateInputChange}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="force_password_reset"
            checked={Boolean(createForm.force_password_reset)}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                force_password_reset: event.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          <span>Force password reset on first login</span>
        </label>

        {(createForm.role === "school" || createForm.role === "ngo") && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <label className="space-y-1 text-sm text-gray-700 md:col-span-3">
              <span>Legal Institution Name</span>
              <input
                name="legal_name"
                value={createForm.legal_name}
                onChange={handleCreateInputChange}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Registration/License Number</span>
              <input
                name="registration_number"
                value={createForm.registration_number}
                onChange={handleCreateInputChange}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Tax ID / TIN</span>
              <input
                name="tax_id"
                value={createForm.tax_id}
                onChange={handleCreateInputChange}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Official Institution Email</span>
              <input
                name="official_email"
                value={createForm.official_email}
                onChange={handleCreateInputChange}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Authorized Representative Name</span>
              <input
                name="authorized_representative_name"
                value={createForm.authorized_representative_name}
                onChange={handleCreateInputChange}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Authorized Representative Role</span>
              <input
                name="authorized_representative_role"
                value={createForm.authorized_representative_role}
                onChange={handleCreateInputChange}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Initial Verification Status</span>
              <select
                name="verification_status"
                value={createForm.verification_status}
                onChange={handleCreateInputChange}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
              >
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={createOrganizationAccount}
            disabled={creatingAccount}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              creatingAccount
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#1F1F1F] hover:bg-black"
            }`}
          >
            {creatingAccount ? "Creating..." : "Create Account"}
          </button>
        </div>
      </section>

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

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
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
