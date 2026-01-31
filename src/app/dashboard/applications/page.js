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
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadUserProfileAndApplications();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router, filter]);

  async function loadUserProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, full_name, phone, location, bio")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  }

  async function loadUserProfileAndApplications() {
    try {
      setLoading(true);

      const profile = await loadUserProfile();
      if (!profile) {
        console.error("No profile found");
        setLoading(false);
        return;
      }

      setUserRole(profile.role);

      if (profile.role === "student" || profile.role === "teacher") {
        await loadJobSeekerApplications(profile.id);
      } else if (
        profile.role === "family" ||
        profile.role === "school" ||
        profile.role === "ngo"
      ) {
        await loadEmployerApplications(profile.id);
      } else {
        console.log("Unknown role, showing empty applications");
        setApplications([]);
      }
    } catch (error) {
      console.error("Error in loadUserProfileAndApplications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadJobSeekerApplications(userId) {
    try {
      console.log("Loading applications for user:", userId);

      // Step 1: Get applications
      let query = supabase
        .from("applications")
        .select("*")
        .eq("applicant_id", userId)
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: applicationsData, error: applicationsError } = await query;

      if (applicationsError) {
        console.error("Applications error:", applicationsError);
        throw applicationsError;
      }

      console.log("Found applications:", applicationsData?.length || 0);

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([]);
        return;
      }

      // Step 2: Get job IDs
      const jobIds = applicationsData.map((app) => app.job_id).filter(Boolean);
      console.log("Job IDs to fetch:", jobIds);

      if (jobIds.length === 0) {
        console.log("No valid job IDs found");
        setApplications([]);
        return;
      }

      // Step 3: Get jobs - SIMPLIFIED QUERY
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, job_type, organization_id, location, description")
        .in("id", jobIds);

      if (jobsError) {
        console.error("Jobs fetch error details:", {
          message: jobsError.message,
          details: jobsError.details,
          hint: jobsError.hint,
          code: jobsError.code,
        });
        throw jobsError;
      }

      console.log("Jobs fetched:", jobsData?.length || 0);

      // Step 4: Get organization profiles
      const organizationIds =
        jobsData?.map((job) => job.organization_id).filter(Boolean) || [];
      console.log("Organization IDs:", organizationIds);

      let organizationProfiles = [];
      if (organizationIds.length > 0) {
        const { data: orgData, error: orgError } = await supabase
          .from("profiles")
          .select("id, full_name, role, location, phone")
          .in("id", organizationIds);

        if (orgError) {
          console.error("Org profiles error:", orgError);
        } else {
          organizationProfiles = orgData || [];
        }
      }

      // Step 5: Combine data
      const enrichedApplications = applicationsData.map((application) => {
        const job = jobsData?.find((j) => j.id === application.job_id) || {};
        const orgProfile =
          organizationProfiles?.find((p) => p.id === job.organization_id) || {};

        return {
          ...application,
          job: {
            id: job.id,
            title: job.title || "Untitled Job",
            job_type: job.job_type || "Part-time",
            organization_id: job.organization_id,
            location: job.location || "Remote",
            description: job.description,
          },
          organization_profile: {
            id: orgProfile.id,
            full_name: orgProfile.full_name || "Private Organization",
            role: orgProfile.role,
            location: orgProfile.location,
            phone: orgProfile.phone,
          },
        };
      });

      setApplications(enrichedApplications);
    } catch (error) {
      console.error("Error in loadJobSeekerApplications:", error);
      setApplications([]);
    }
  }

  async function loadEmployerApplications(employerId) {
    try {
      console.log("Loading employer applications for:", employerId);

      // Step 1: Get jobs posted by employer
      const { data: employerJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, job_type, location, description")
        .eq("organization_id", employerId)
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.error("Employer jobs error:", jobsError);
        throw jobsError;
      }

      console.log("Employer jobs:", employerJobs?.length || 0);

      if (!employerJobs || employerJobs.length === 0) {
        setApplications([]);
        return;
      }

      const jobIds = employerJobs.map((job) => job.id);

      // Step 2: Get applications for these jobs
      let query = supabase
        .from("applications")
        .select("*")
        .in("job_id", jobIds)
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: applicationsData, error: applicationsError } = await query;

      if (applicationsError) {
        console.error("Applications error:", applicationsError);
        throw applicationsError;
      }

      console.log(
        "Applications for employer jobs:",
        applicationsData?.length || 0,
      );

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([]);
        return;
      }

      // Step 3: Get applicant profiles
      const applicantIds = applicationsData
        .map((app) => app.applicant_id)
        .filter(Boolean);

      const { data: applicantProfiles, error: applicantError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, location, bio")
        .in("id", applicantIds);

      if (applicantError) {
        console.error("Applicant profiles error:", applicantError);
        throw applicantError;
      }

      // Step 4: Combine data
      const enrichedApplications = applicationsData.map((application) => {
        const job = employerJobs.find((j) => j.id === application.job_id) || {};
        const applicantProfile =
          applicantProfiles?.find((p) => p.id === application.applicant_id) ||
          {};

        return {
          ...application,
          job: {
            id: job.id,
            title: job.title || "Untitled Job",
            job_type: job.job_type || "Part-time",
            location: job.location || "Remote",
            description: job.description,
          },
          applicant_profile: {
            id: applicantProfile.id,
            full_name: applicantProfile.full_name || "Anonymous Applicant",
            phone: applicantProfile.phone,
            role: applicantProfile.role || "student",
            location: applicantProfile.location,
            bio: applicantProfile.bio,
          },
        };
      });

      setApplications(enrichedApplications);
    } catch (error) {
      console.error("Error in loadEmployerApplications:", error);
      setApplications([]);
    }
  }

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;

      await loadUserProfileAndApplications();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      reviewed: "bg-blue-100 text-blue-800 border border-blue-200",
      shortlisted: "bg-purple-100 text-purple-800 border border-purple-200",
      interviewing: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      hired: "bg-green-100 text-green-800 border border-green-200",
      rejected: "bg-red-100 text-red-800 border border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00]"></div>
      </div>
    );
  }

  const isJobSeeker = userRole === "student" || userRole === "teacher";
  const isEmployer =
    userRole === "family" || userRole === "school" || userRole === "ngo";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isJobSeeker ? "My Applications" : "Applications Received"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isJobSeeker
            ? "Track your job applications"
            : "Review applications for your posted jobs"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "reviewed", "shortlisted", "hired", "rejected"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === status
                  ? "bg-[#FF1E00] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "all"
                ? "All"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ),
        )}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {applications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {applications.map((app) => (
              <div key={app.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {app.job?.title || "Untitled Job"}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                          {isJobSeeker ? (
                            <>
                              <span>
                                Organization:{" "}
                                {app.organization_profile?.full_name ||
                                  "Private"}
                              </span>
                              <span>•</span>
                              <span>
                                Location: {app.job?.location || "Remote"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>
                                Applicant:{" "}
                                {app.applicant_profile?.full_name ||
                                  "Anonymous"}
                              </span>
                              <span>•</span>
                              <span>
                                Role:{" "}
                                {app.applicant_profile?.role || "Applicant"}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>Applied: {formatDate(app.submitted_at)}</span>
                        </div>

                        {app.cover_letter && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Cover Letter:
                            </h4>
                            <p className="text-gray-600 text-sm p-3 bg-gray-50 rounded-lg">
                              {app.cover_letter}
                            </p>
                          </div>
                        )}

                        {app.resume_url && (
                          <div className="mb-4">
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#FF1E00] hover:text-[#E01B00] font-medium"
                            >
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px]">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}
                        >
                          {app.status.charAt(0).toUpperCase() +
                            app.status.slice(1)}
                        </span>

                        {isEmployer && (
                          <div className="flex flex-wrap gap-2">
                            {app.status !== "reviewed" && (
                              <button
                                onClick={() =>
                                  updateApplicationStatus(app.id, "reviewed")
                                }
                                className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                              >
                                Review
                              </button>
                            )}
                            {app.status !== "shortlisted" && (
                              <button
                                onClick={() =>
                                  updateApplicationStatus(app.id, "shortlisted")
                                }
                                className="text-xs px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                              >
                                Shortlist
                              </button>
                            )}
                            {app.status !== "hired" && (
                              <button
                                onClick={() =>
                                  updateApplicationStatus(app.id, "hired")
                                }
                                className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                              >
                                Hire
                              </button>
                            )}
                            {app.status !== "rejected" && (
                              <button
                                onClick={() =>
                                  updateApplicationStatus(app.id, "rejected")
                                }
                                className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-gray-400 text-4xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No Applications Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              {filter === "all"
                ? isJobSeeker
                  ? "You haven't applied for any jobs yet."
                  : "You haven't received any applications yet."
                : `No ${filter} applications found.`}
            </p>
            <button
              onClick={() =>
                router.push(isJobSeeker ? "/jobs" : "/dashboard/jobs/post")
              }
              className="px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] font-medium"
            >
              {isJobSeeker ? "Browse Jobs" : "Post a Job"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
