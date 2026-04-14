"use client";

import { useEffect, useState } from "react";

const metricCards = [
  { key: "users", label: "Total Users" },
  { key: "newUsersThisWeek", label: "New This Week" },
  { key: "trialUsers", label: "Trial Users" },
  { key: "premiumUsers", label: "Premium Users" },
  { key: "paidUsers", label: "Paid Users" },
];

export default function AdminOverviewPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/overview", {
          method: "GET",
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load overview.");
        }

        if (isMounted) {
          setOverview(result);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Failed to load overview.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
        Loading admin insights...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  const totals = overview?.totals || {};
  const roleBreakdown = overview?.roleBreakdown || {};

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
        <p className="mt-1 text-gray-600">
          Real-time snapshot for user growth and subscription health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <article
            key={card.key}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-600">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totals[card.key] ?? 0}
            </p>
          </article>
        ))}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Role Distribution
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(roleBreakdown).length === 0 && (
            <p className="text-sm text-gray-500">No role data available yet.</p>
          )}
          {Object.entries(roleBreakdown).map(([role, count]) => (
            <div
              key={role}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <p className="text-sm uppercase tracking-wide text-gray-600">
                {role}
              </p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {count}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
