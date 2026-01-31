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
  const [userProfile, setUserProfile] = useState(null);

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
        .select("id, role, full_name, email, phone, location, bio")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  }

  // Function to load applications based on user role
  async function loadUserProfileAndApplications() {
    try {
      setLoading(true);

      // Load user profile first
      const profile = await loadUserProfile();
      if (!profile) {
        console.error("No profile found for user");
        setLoading(false);
        return;
      }

      setUserProfile(profile);
      setUserRole(profile.role);

      // Load applications based on role
      if (profile.role === "student" || profile.role === "teacher") {
        // User is a job seeker - show applications they've submitted
        await loadJobSeekerApplications(profile.id);
      } else if (
        profile.role === "family" ||
        profile.role === "school" ||
        profile.role === "ngo"
      ) {
        // User is an employer - show applications for jobs they've posted
        await loadEmployerApplications(profile.id);
      } else {
        console.error("Unknown user role:", profile.role);
        setApplications([]);
      }
    } catch (error) {
      console.error("Error loading profile and applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  // Load applications for job seekers (students and teachers)
  async function loadJobSeekerApplications(userId) {
    try {
      // Step 1: Fetch applications submitted by this user
      let query = supabase
        .from("applications")
        .select("*")
        .eq("applicant_id", userId)
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: applicationsData, error: applicationsError } = await query;

      if (applicationsError) throw applicationsError;

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([]);
        return;
      }

      // Step 2: Get all job IDs from applications
      const jobIds = applicationsData.map((app) => app.job_id).filter(Boolean);

      // Step 3: Fetch job details in bulk
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select(
          `
          id, 
          title, 
          job_type, 
          employer_id, 
          location, 
          description, 
          salary_range,
          schedule_type,
          requirements,
          created_at
        `,
        )
        .in("id", jobIds);

      if (jobsError) throw jobsError;

      // Step 4: Fetch employer profiles in bulk
      const employerIds =
        jobsData?.map((job) => job.employer_id).filter(Boolean) || [];
      const { data: employerProfiles, error: employerError } =
        employerIds.length > 0
          ? await supabase
              .from("profiles")
              .select("id, full_name, role, location, phone, organization_name")
              .in("id", employerIds)
          : { data: [], error: null };

      if (employerError) throw employerError;

      // Step 5: Combine all data
      const enrichedApplications = applicationsData.map((application) => {
        const job = jobsData?.find((j) => j.id === application.job_id) || {};
        const employerProfile =
          employerProfiles?.find((p) => p.id === job.employer_id) || {};

        // Get employer display name based on their role
        let employerDisplayName =
          employerProfile.full_name || "Private Employer";
        if (employerProfile.organization_name) {
          employerDisplayName = employerProfile.organization_name;
        }

        return {
          ...application,
          job: {
            id: job.id,
            title: job.title || "Untitled Job",
            job_type: job.job_type || "Part-time",
            employer_id: job.employer_id,
            location: job.location || "Remote",
            description: job.description,
            salary_range: job.salary_range,
            schedule_type: job.schedule_type,
            requirements: job.requirements,
            created_at: job.created_at,
          },
          employer_profile: {
            id: employerProfile.id,
            full_name: employerProfile.full_name,
            role: employerProfile.role,
            organization_name: employerProfile.organization_name,
            location: employerProfile.location,
            phone: employerProfile.phone,
            display_name: employerDisplayName,
          },
          is_job_seeker_view: true,
        };
      });

      setApplications(enrichedApplications);
    } catch (error) {
      console.error("Error loading job seeker applications:", error);
      setApplications([]);
    }
  }

  // Load applications for employers (families, schools, NGOs)
  async function loadEmployerApplications(employerId) {
    try {
      // Step 1: Fetch jobs posted by this employer
      const { data: employerJobs, error: jobsError } = await supabase
        .from("jobs")
        .select(
          `
          id, 
          title, 
          job_type, 
          location, 
          description, 
          salary_range,
          schedule_type,
          requirements,
          created_at
        `,
        )
        .eq("employer_id", employerId)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      if (!employerJobs || employerJobs.length === 0) {
        setApplications([]);
        return;
      }

      const jobIds = employerJobs.map((job) => job.id);

      // Step 2: Fetch applications for these jobs
      let query = supabase
        .from("applications")
        .select("*")
        .in("job_id", jobIds)
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: applicationsData, error: applicationsError } = await query;

      if (applicationsError) throw applicationsError;

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([]);
        return;
      }

      // Step 3: Fetch applicant profiles in bulk
      const applicantIds = applicationsData
        .map((app) => app.applicant_id)
        .filter(Boolean);
      const { data: applicantProfiles, error: applicantError } = await supabase
        .from("profiles")
        .select(
          `
          id, 
          full_name, 
          email, 
          phone, 
          role, 
          location, 
          bio,
          education_level,
          subjects_expertise,
          years_experience,
          hourly_rate,
          availability
        `,
        )
        .in("id", applicantIds);

      if (applicantError) throw applicantError;

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
            salary_range: job.salary_range,
            schedule_type: job.schedule_type,
            requirements: job.requirements,
          },
          applicant_profile: {
            id: applicantProfile.id,
            full_name: applicantProfile.full_name || "Anonymous Applicant",
            email: applicantProfile.email,
            phone: applicantProfile.phone,
            role: applicantProfile.role || "student",
            location: applicantProfile.location,
            bio: applicantProfile.bio,
            education_level: applicantProfile.education_level,
            subjects_expertise: applicantProfile.subjects_expertise,
            years_experience: applicantProfile.years_experience,
            hourly_rate: applicantProfile.hourly_rate,
            availability: applicantProfile.availability,
          },
          is_employer_view: true,
        };
      });

      setApplications(enrichedApplications);
    } catch (error) {
      console.error("Error loading employer applications:", error);
      setApplications([]);
    }
  }

  // Function to update application status (for employers)
  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) throw error;

      // Reload applications
      await loadUserProfileAndApplications();
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Failed to update application status. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "reviewed":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "shortlisted":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "interviewing":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "hired":
        return "bg-green-100 text-green-800 border border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const isJobSeeker = userRole === "student" || userRole === "teacher";
  const isEmployer =
    userRole === "family" || userRole === "school" || userRole === "ngo";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F]">
          {isJobSeeker
            ? "My Applications"
            : isEmployer
              ? "Job Applications"
              : "Applications"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isJobSeeker
            ? "Track your job applications and their status"
            : isEmployer
              ? "Review applications for your posted jobs"
              : "Manage applications"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium ${filter === "all" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          All Applications
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium ${filter === "pending" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setFilter("reviewed")}
          className={`px-4 py-2 rounded-lg font-medium ${filter === "reviewed" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Reviewed
        </button>
        <button
          onClick={() => setFilter("shortlisted")}
          className={`px-4 py-2 rounded-lg font-medium ${filter === "shortlisted" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Shortlisted
        </button>
        {isEmployer && (
          <button
            onClick={() => setFilter("interviewing")}
            className={`px-4 py-2 rounded-lg font-medium ${filter === "interviewing" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Interviewing
          </button>
        )}
        <button
          onClick={() => setFilter("hired")}
          className={`px-4 py-2 rounded-lg font-medium ${filter === "hired" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Hired
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-lg font-medium ${filter === "rejected" ? "bg-[#FF1E00] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Rejected
        </button>
      </div>

      {/* Stats Summary */}
      {applications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-[#1F1F1F]">
              {applications.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-700">
              {applications.filter((app) => app.status === "pending").length}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">
              {applications.filter((app) => app.status === "reviewed").length}
            </div>
            <div className="text-sm text-blue-600">Reviewed</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-100">
            <div className="text-2xl font-bold text-purple-700">
              {
                applications.filter((app) => app.status === "shortlisted")
                  .length
              }
            </div>
            <div className="text-sm text-purple-600">Shortlisted</div>
          </div>
          {isEmployer && (
            <div className="bg-indigo-50 p-4 rounded-lg shadow border border-indigo-100">
              <div className="text-2xl font-bold text-indigo-700">
                {
                  applications.filter((app) => app.status === "interviewing")
                    .length
                }
              </div>
              <div className="text-sm text-indigo-600">Interviewing</div>
            </div>
          )}
          <div className="bg-green-50 p-4 rounded-lg shadow border border-green-100">
            <div className="text-2xl font-bold text-green-700">
              {applications.filter((app) => app.status === "hired").length}
            </div>
            <div className="text-sm text-green-600">Hired</div>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {applications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left side - Application details */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#1F1F1F] mb-2">
                          {app.job?.title || "Untitled Job"}
                        </h3>

                        {/* Job/Applicant info */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                          {isJobSeeker ? (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Employer:</span>
                                <span>
                                  {app.employer_profile?.display_name ||
                                    "Private"}
                                </span>
                              </div>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Type:</span>
                                <span>{app.job?.job_type || "Part-time"}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Applicant:</span>
                                <span>
                                  {app.applicant_profile?.full_name ||
                                    "Anonymous"}
                                </span>
                              </div>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Role:</span>
                                <span className="capitalize">
                                  {app.applicant_profile?.role || "Applicant"}
                                </span>
                              </div>
                            </>
                          )}
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Applied:</span>
                            <span>{formatDate(app.submitted_at)}</span>
                          </div>
                        </div>

                        {/* Job details for job seekers */}
                        {isJobSeeker && app.job && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">
                                Location
                              </div>
                              <div className="font-medium">
                                {app.job.location || "Remote"}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">
                                Schedule
                              </div>
                              <div className="font-medium capitalize">
                                {app.job.schedule_type || "Flexible"}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">
                                Salary Range
                              </div>
                              <div className="font-medium">
                                {app.job.salary_range || "Negotiable"}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Applicant details for employers */}
                        {isEmployer && app.applicant_profile && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">
                                Education Level
                              </div>
                              <div className="font-medium">
                                {app.applicant_profile.education_level ||
                                  "Not specified"}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">
                                Experience
                              </div>
                              <div className="font-medium">
                                {app.applicant_profile.years_experience
                                  ? `${app.applicant_profile.years_experience} years`
                                  : "Not specified"}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">
                                Hourly Rate
                              </div>
                              <div className="font-medium">
                                {app.applicant_profile.hourly_rate
                                  ? `$${app.applicant_profile.hourly_rate}/hr`
                                  : "Negotiable"}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cover Letter */}
                        {app.cover_letter && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Cover Letter:
                            </h4>
                            <p className="text-gray-600 text-sm p-3 bg-gray-50 rounded-lg border border-gray-200">
                              {app.cover_letter}
                            </p>
                          </div>
                        )}

                        {/* Resume Link */}
                        {app.resume_url && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Resume:
                            </h4>
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-[#FF1E00] hover:text-[#E01B00] font-medium"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right side - Status and actions */}
                      <div className="flex flex-col items-start lg:items-end gap-3 min-w-[200px]">
                        <div className="flex flex-col gap-2 w-full">
                          <span
                            className={`text-sm font-medium px-3 py-1.5 rounded-full ${getStatusColor(app.status)} self-start lg:self-end`}
                          >
                            {app.status.charAt(0).toUpperCase() +
                              app.status.slice(1)}
                          </span>

                          {/* Last updated */}
                          {app.updated_at && (
                            <div className="text-xs text-gray-500 text-left lg:text-right">
                              Updated: {formatDate(app.updated_at)}
                            </div>
                          )}
                        </div>

                        {/* Employer actions */}
                        {isEmployer && (
                          <div className="flex flex-col gap-2 w-full">
                            <div className="text-sm font-medium text-gray-700">
                              Update Status:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {app.status !== "reviewed" && (
                                <button
                                  onClick={() =>
                                    updateApplicationStatus(app.id, "reviewed")
                                  }
                                  className="text-xs px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 border border-blue-200"
                                >
                                  Mark Reviewed
                                </button>
                              )}
                              {app.status !== "shortlisted" && (
                                <button
                                  onClick={() =>
                                    updateApplicationStatus(
                                      app.id,
                                      "shortlisted",
                                    )
                                  }
                                  className="text-xs px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 border border-purple-200"
                                >
                                  Shortlist
                                </button>
                              )}
                              {app.status !== "interviewing" && (
                                <button
                                  onClick={() =>
                                    updateApplicationStatus(
                                      app.id,
                                      "interviewing",
                                    )
                                  }
                                  className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 border border-indigo-200"
                                >
                                  Interview
                                </button>
                              )}
                              {app.status !== "hired" && (
                                <button
                                  onClick={() =>
                                    updateApplicationStatus(app.id, "hired")
                                  }
                                  className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 border border-green-200"
                                >
                                  Hire
                                </button>
                              )}
                              {app.status !== "rejected" && (
                                <button
                                  onClick={() =>
                                    updateApplicationStatus(app.id, "rejected")
                                  }
                                  className="text-xs px-3 py-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 border border-red-200"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Contact buttons for employers */}
                        {isEmployer && app.applicant_profile && (
                          <div className="flex gap-2 w-full">
                            {app.applicant_profile.phone && (
                              <a
                                href={`tel:${app.applicant_profile.phone}`}
                                className="flex-1 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 text-center"
                              >
                                Call
                              </a>
                            )}
                            {app.applicant_profile.email && (
                              <a
                                href={`mailto:${app.applicant_profile.email}`}
                                className="flex-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 text-center"
                              >
                                Email
                              </a>
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
            <h3 className="text-2xl font-semibold text-[#1F1F1F] mb-3">
              No Applications Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              {filter === "all"
                ? isJobSeeker
                  ? "You haven't applied for any afterschool jobs yet. Start browsing opportunities!"
                  : isEmployer
                    ? "You haven't received any applications yet. Post a job to find qualified tutors and teachers."
                    : "No applications to display."
                : `No ${filter} applications found.`}
            </p>
            <button
              onClick={() =>
                router.push(isJobSeeker ? "/jobs" : "/dashboard/jobs/post")
              }
              className="px-8 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium shadow-sm"
            >
              {isJobSeeker ? "Browse Afterschool Jobs" : "Post a Job"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
