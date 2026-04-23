"use client";

import { useEffect, useMemo, useState } from "react";

const tierOptions = ["all", "trial", "free", "premium"];
const paymentOptions = ["all", "paid", "pending", "unpaid"];

export default function SubscriptionManagementPanel() {
  const [items, setItems] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [busyUserId, setBusyUserId] = useState("");
  const [busyRequestId, setBusyRequestId] = useState("");

  const params = useMemo(
    () =>
      new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        search,
        tier,
        paymentStatus,
      }),
    [pagination.page, pagination.pageSize, search, tier, paymentStatus],
  );

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/subscriptions?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch subscriptions.");
      }

      setItems(result.items || []);
      setPagination((prev) => ({ ...prev, ...(result.pagination || {}) }));
    } catch (loadError) {
      setError(loadError.message || "Failed to fetch subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentRequests = async () => {
    try {
      const response = await fetch(
        "/api/admin/payment-requests?status=pending",
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to load payment requests.");
      }

      setPaymentRequests(result.items || []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load payment requests.");
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [params]);

  useEffect(() => {
    loadPaymentRequests();
  }, []);

  const updateSubscription = async (userId, payload) => {
    try {
      setBusyUserId(userId);

      const response = await fetch(`/api/admin/subscriptions/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update subscription.");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === userId ? { ...item, ...result.item } : item,
        ),
      );
    } catch (updateError) {
      setError(updateError.message || "Failed to update subscription.");
    } finally {
      setBusyUserId("");
    }
  };

  const verifyPaymentRequest = async (requestId, action) => {
    try {
      setBusyRequestId(requestId);

      const response = await fetch(`/api/admin/payment-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify payment request.");
      }

      setPaymentRequests((prev) =>
        prev.filter((request) => request.id !== requestId),
      );

      if (result.profile?.id) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === result.profile.id
              ? { ...item, ...result.profile }
              : item,
          ),
        );
      }
    } catch (verifyError) {
      setError(verifyError.message || "Failed to verify payment request.");
    } finally {
      setBusyRequestId("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Subscription Management
        </h2>
        <p className="mt-1 text-gray-600">
          Manage subscription tier and payment status for all users.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <input
            value={search}
            onChange={(event) => {
              setPagination((prev) => ({ ...prev, page: 1 }));
              setSearch(event.target.value);
            }}
            placeholder="Search by name or email"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          />

          <select
            value={tier}
            onChange={(event) => {
              setPagination((prev) => ({ ...prev, page: 1 }));
              setTier(event.target.value);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            {tierOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All tiers" : option}
              </option>
            ))}
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => {
              setPagination((prev) => ({ ...prev, page: 1 }));
              setPaymentStatus(event.target.value);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            {paymentOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All payment states" : option}
              </option>
            ))}
          </select>

          <button
            onClick={loadSubscriptions}
            className="h-10 rounded-lg bg-[#1F1F1F] px-4 text-sm font-medium text-white"
          >
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-base font-semibold text-gray-900">
            Pending Bank Transfer Verifications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Proof
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paymentRequests.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                    No pending payment proofs.
                  </td>
                </tr>
              )}
              {paymentRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">
                      {request.profile?.full_name || "No Name"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.profile?.email || "No email"}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 capitalize">
                    {(request.method || "").replace("_", " ")}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {request.currency} {request.amount}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {request.proof_url ? (
                      <a
                        href={request.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                      >
                        View screenshot
                      </a>
                    ) : (
                      <span className="text-gray-500">No proof</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {request.created_at
                      ? new Date(request.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={busyRequestId === request.id}
                        onClick={() =>
                          verifyPaymentRequest(request.id, "approve")
                        }
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyRequestId === request.id}
                        onClick={() =>
                          verifyPaymentRequest(request.id, "reject")
                        }
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Trial End
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Subscription End
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                    No subscription records found.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">
                      {item.full_name || "No Name"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.email || "No email"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={item.subscription_tier || "free"}
                      disabled={busyUserId === item.id}
                      onChange={(event) =>
                        updateSubscription(item.id, {
                          subscription_tier: event.target.value,
                        })
                      }
                      className="h-9 rounded border border-gray-300 px-2 text-sm"
                    >
                      {tierOptions
                        .filter((option) => option !== "all")
                        .map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={item.payment_status || "unpaid"}
                      disabled={busyUserId === item.id}
                      onChange={(event) =>
                        updateSubscription(item.id, {
                          payment_status: event.target.value,
                        })
                      }
                      className="h-9 rounded border border-gray-300 px-2 text-sm"
                    >
                      {paymentOptions
                        .filter((option) => option !== "all")
                        .map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.trial_end_date
                      ? new Date(item.trial_end_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.subscription_end_date
                      ? new Date(
                          item.subscription_end_date,
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      disabled={busyUserId === item.id}
                      onClick={() =>
                        updateSubscription(item.id, {
                          trial_end_date: null,
                          subscription_end_date: null,
                        })
                      }
                      className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {busyUserId === item.id ? "Updating..." : "Reset Dates"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing page {pagination.page} of {pagination.totalPages} (
          {pagination.total} records)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(prev.page - 1, 1),
              }))
            }
            disabled={pagination.page <= 1 || loading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(prev.page + 1, prev.totalPages),
              }))
            }
            disabled={pagination.page >= pagination.totalPages || loading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
