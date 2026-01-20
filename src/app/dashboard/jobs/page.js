// app/dashboard/jobs/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function JobsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    job_type: "",
    location_type: "",
    subject: "",
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadJobs();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router, filters]);

  async function loadJobs() {
    try {
      let query = supabase
        .from("jobs")
        .select(
          `
          *,
          profiles!jobs_employer_id_fkey(full_name)
        `,
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.job_type) {
        query = query.eq("job_type", filters.job_type);
      }
      if (filters.location_type) {
        query = query.eq("location_type", filters.location_type);
      }
      if (filters.subject) {
        query = query.ilike("subject", `%${filters.subject}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async (jobId) => {
    try {
      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("current_period_end", new Date().toISOString())
        .single();

      if (!subscription) {
        alert(
          "You need an active subscription to apply for jobs. Please upgrade your plan.",
        );
        router.push("/dashboard/subscription");
        return;
      }

      // Apply for job
      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        applicant_id: user.id,
        status: "pending",
      });

      if (error) throw error;

      alert("Application submitted successfully!");
      loadJobs(); // Refresh the list
    } catch (error) {
      console.error("Error applying for job:", error);
      alert("Failed to apply. Please try again.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00] mb-4"></div>
        <p className="text-gray-600">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1F1F1F]">Find Jobs</h1>
            <p className="text-gray-600 mt-2">
              Browse available teaching and tutoring opportunities
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/applications"
              className="px-4 py-2 border border-[#1F1F1F] text-[#1F1F1F] rounded-lg hover:bg-[#1F1F1F] hover:text-white transition-colors"
            >
              My Applications
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-[#1F1F1F] mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Type
            </label>
            <select
              value={filters.job_type}
              onChange={(e) =>
                setFilters({ ...filters, job_type: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50"
            >
              <option value="">All Types</option>
              <option value="tutor">Tutor</option>
              <option value="assistant">Assistant</option>
              <option value="mentor">Mentor</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={filters.location_type}
              onChange={(e) =>
                setFilters({ ...filters, location_type: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50"
            >
              <option value="">All Locations</option>
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              placeholder="e.g., Mathematics"
              value={filters.subject}
              onChange={(e) =>
                setFilters({ ...filters, subject: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50"
            />
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:border-[#FF1E00] transition-colors"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1F1F1F] mb-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm text-gray-600">
                        {job.profiles?.full_name}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                        {job.job_type}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${job.location_type === "remote" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                  >
                    {job.location_type}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📚</span>
                    <span>{job.subject || "Various Subjects"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📍</span>
                    <span>{job.address || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">⏰</span>
                    <span>{job.duration_weeks} weeks</span>
                  </div>
                </div>

                <button
                  onClick={() => handleApply(job.id)}
                  className="w-full py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-gray-400 text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-[#1F1F1F] mb-2">
              No Jobs Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No jobs match your current filters. Try adjusting your search
              criteria or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
