"use client";

import { useEffect, useMemo, useState } from "react";

const roleOptions = [
  "all",
  "teacher",
  "student",
  "family",
  "school",
  "ngo",
  "admin",
];

export default function UserManagementPanel() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [busyUserId, setBusyUserId] = useState("");

  const params = useMemo(
    () =>
      new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        search,
        role,
      }),
    [pagination.page, pagination.pageSize, search, role],
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch users.");
      }

      setUsers(result.items || []);
      setPagination((prev) => ({ ...prev, ...(result.pagination || {}) }));
    } catch (loadError) {
      setError(loadError.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [params]);

  const updateUser = async (userId, payload) => {
    try {
      setBusyUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user.");
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...result.item } : user,
        ),
      );
    } catch (updateError) {
      setError(updateError.message || "Failed to update user.");
    } finally {
      setBusyUserId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="mt-1 text-gray-600">
            Search users, change roles, and suspend or reactivate accounts.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
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
            value={role}
            onChange={(event) => {
              setPagination((prev) => ({ ...prev, page: 1 }));
              setRole(event.target.value);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            {roleOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All roles" : item}
              </option>
            ))}
          </select>
          <button
            onClick={loadUsers}
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Subscription
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && users.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">
                      {user.full_name || "No Name"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.email || "No email"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={user.role || "teacher"}
                      onChange={(event) =>
                        updateUser(user.id, { role: event.target.value })
                      }
                      disabled={busyUserId === user.id}
                      className="h-9 rounded border border-gray-300 px-2 text-sm"
                    >
                      {roleOptions
                        .filter((item) => item !== "all")
                        .map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        user.status === "suspended"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {user.subscription_tier || "free"} /{" "}
                    {user.payment_status || "unpaid"}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      disabled={busyUserId === user.id}
                      onClick={() =>
                        updateUser(user.id, {
                          suspended: user.status !== "suspended",
                        })
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                        user.status === "suspended"
                          ? "bg-emerald-600"
                          : "bg-red-600"
                      }`}
                    >
                      {busyUserId === user.id
                        ? "Updating..."
                        : user.status === "suspended"
                          ? "Reactivate"
                          : "Suspend"}
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
          {pagination.total} users)
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
