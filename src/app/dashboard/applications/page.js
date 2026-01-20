// app/dashboard/applications/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && user) {
      loadApplications();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router, filter]);

  async function loadApplications() {
    try {
      let query = supabase
        .from("applications")
        .select(
          `
          *,
          jobs!inner(title, job_type, employer_id),
          profiles!jobs_employer_id_fkey(full_name)
        `,
        )
        .eq("applicant_id", user.id)
        .order("applied_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "shortlisted":
        return "bg-purple-100 text-purple-800";
      case "hired":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00] mb-4"></div>
        <p className="text-gray-600">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F]">My Applications</h1>
        <p className="text-gray-600 mt-2">
          Track the status of your job applications
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg ${filter === "all" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg ${filter === "pending" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("reviewed")}
          className={`px-4 py-2 rounded-lg ${filter === "reviewed" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Reviewed
        </button>
        <button
          onClick={() => setFilter("shortlisted")}
          className={`px-4 py-2 rounded-lg ${filter === "shortlisted" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Shortlisted
        </button>
        <button
          onClick={() => setFilter("hired")}
          className={`px-4 py-2 rounded-lg ${filter === "hired" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Hired
        </button>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {applications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1F1F1F] mb-2">
                          {app.jobs?.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span>
                            Employer: {app.profiles?.full_name || "N/A"}
                          </span>
                          <span>•</span>
                          <span>Applied: {formatDate(app.applied_at)}</span>
                          <span>•</span>
                          <span>{app.jobs?.job_type}</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusColor(app.status)}`}
                      >
                        {app.status.charAt(0).toUpperCase() +
                          app.status.slice(1)}
                      </span>
                    </div>

                    {app.cover_letter && (
                      <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                        {app.cover_letter}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 mt-4">
                      {app.reviewed_at && (
                        <span className="text-sm text-gray-500">
                          Reviewed: {formatDate(app.reviewed_at)}
                        </span>
                      )}
                      {app.hired_at && (
                        <span className="text-sm text-green-600 font-medium">
                          Hired on: {formatDate(app.hired_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-gray-400 text-3xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold text-[#1F1F1F] mb-2">
              No Applications
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {filter === "all"
                ? "You haven't applied for any jobs yet. Start browsing opportunities!"
                : `No ${filter} applications found.`}
            </p>
            <button
              onClick={() => router.push("/dashboard/jobs")}
              className="px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium"
            >
              Browse Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
