// app/dashboard/profile/components/MyJobs.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  EMPLOYMENT_TYPE_LABEL_MAP,
  EMPLOYMENT_TYPE_OPTIONS,
  JOB_MODE_OPTIONS,
  normalizeJobModel,
  validateJobModel,
} from "@/lib/jobs/model";
import { isDeadlineExpired } from "@/lib/jobs/deadline";
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Language",
  "Amharic",
  "Afan Oromo",
  "History",
  "Geography",
  "Civics",
  "Economics",
  "Business Studies",
  "Computer Science",
  "ICT",
  "Art",
  "Music",
  "Physical Education",
  "Religious Education",
  "Other",
];
const GRADE_LEVELS = [
  "Elementary (1-4)",
  "Primary (5-8)",
  "Secondary (9-10)",
  "Preparatory (11-12)",
  "University",
  "Adult Education",
];

function getReadableErrorMessage(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object") {
    const errorParts = [error.message, error.details, error.hint, error.code]
      .filter(Boolean)
      .map((part) => String(part).trim());

    if (errorParts.length > 0) {
      return errorParts.join(" | ");
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Unexpected error object";
    }
  }

  return String(error);
}

function getMissingJobsColumnFromSchemaCacheError(error) {
  const message = getReadableErrorMessage(error);
  const match = message.match(
    /could not find the '([^']+)' column of 'jobs' in the schema cache/i,
  );

  return match?.[1] || null;
}

export default function MyJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerRole, setViewerRole] = useState(null);
  const [organizationVerification, setOrganizationVerification] = useState({
    status: "verified",
    rejectionReason: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    employment_type: "part_time",
    job_mode: "onsite",
    subject: "",
    grade_levels: [],
    city: "",
    location: "",
    schedule: "",
    salary_range: "",
    application_deadline: "",
    start_date: "",
    duration: "",
    vacancies: 1,
    is_active: true,
  });

  const loadJobs = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("organization_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    async function loadVerificationStatus() {
      if (!user?.id) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = (profile?.role || "").toLowerCase();
        setViewerRole(role || null);

        if (role === "school" || role === "ngo") {
          const { data: organization } = await supabase
            .from("organizations")
            .select("verification_status, verification_rejection_reason")
            .eq("id", user.id)
            .maybeSingle();

          setOrganizationVerification({
            status: (organization?.verification_status || "pending").toLowerCase(),
            rejectionReason: organization?.verification_rejection_reason || "",
          });
        } else {
          setOrganizationVerification({ status: "verified", rejectionReason: "" });
        }
      } catch (error) {
        console.error("Error loading organization verification status:", error);
      }
    }

    loadVerificationStatus();
  }, [user]);

  const needsOrganizationVerification =
    viewerRole === "school" || viewerRole === "ngo";
  const canPostJobs =
    !needsOrganizationVerification || organizationVerification.status === "verified";

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "job_mode") {
      setFormData((prev) => ({
        ...prev,
        job_mode: value,
        city: value === "remote" ? "" : prev.city,
      }));
      return;
    }

    if (type === "checkbox" && name === "grade_levels") {
      const currentLevels = formData.grade_levels || [];
      if (checked) {
        setFormData({ ...formData, grade_levels: [...currentLevels, value] });
      } else {
        setFormData({
          ...formData,
          grade_levels: currentLevels.filter((level) => level !== value),
        });
      }
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (type === "number") {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!user?.id) {
        alert("You must be logged in to post a job.");
        return;
      }

      if (!canPostJobs) {
        const statusMessage =
          organizationVerification.status === "rejected"
            ? "Your organization verification was rejected. Update verification details in your profile and contact support."
            : "Your organization account is pending verification. Job posting is unlocked after approval.";
        alert(statusMessage);
        return;
      }

      const validationResult = validateJobModel(formData);
      if (!validationResult.isValid) {
        alert(validationResult.errors.join("\n"));
        return;
      }

      const normalizedFormData = validationResult.normalized;

      const jobData = {
        ...formData,
        ...normalizedFormData,
        organization_id: user.id,
        requirements: formData.requirements
          .split("\n")
          .filter((req) => req.trim()),
        application_deadline: new Date(
          formData.application_deadline,
        ).toISOString(),
        start_date: formData.start_date
          ? new Date(formData.start_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      };

      const saveJob = async (payload) => {
        if (editingJob) {
          return await supabase
            .from("jobs")
            .update(payload)
            .eq("id", editingJob.id);
        }

        return await supabase.from("jobs").insert([payload]);
      };

      let payload = { ...jobData };
      let error = null;
      const removedColumns = new Set();

      while (true) {
        const result = await saveJob(payload);
        error = result.error;

        if (!error) {
          break;
        }

        const missingColumn = getMissingJobsColumnFromSchemaCacheError(error);
        const canRetry =
          missingColumn &&
          Object.prototype.hasOwnProperty.call(payload, missingColumn) &&
          !removedColumns.has(missingColumn);

        if (!canRetry) {
          break;
        }

        removedColumns.add(missingColumn);

        // Keep legacy location data if city is the missing modern column.
        if (missingColumn === "city" && !payload.location && payload.city) {
          payload.location = payload.city;
        }

        delete payload[missingColumn];
      }

      if (error) throw error;

      // Reset form and reload jobs
      resetForm();
      loadJobs();
    } catch (error) {
      const message = getReadableErrorMessage(error);
      console.error("Error saving job:", message, error);
      alert(`Failed to save job. ${message}`);
    }
  };

  const handleEdit = (job) => {
    const normalizedJob = normalizeJobModel(job);

    setEditingJob(job);
    setFormData({
      title: normalizedJob.title || "",
      description: normalizedJob.description || "",
      requirements: Array.isArray(job.requirements)
        ? job.requirements.join("\n")
        : job.requirements || "",
      employment_type: normalizedJob.employment_type || "part_time",
      job_mode: normalizedJob.job_mode || "onsite",
      subject: normalizedJob.subject || "",
      grade_levels: Array.isArray(job.grade_levels) ? job.grade_levels : [],
      city: normalizedJob.city || "",
      location: normalizedJob.location || "",
      schedule: normalizedJob.schedule || "",
      salary_range: normalizedJob.salary_range || "",
      application_deadline: normalizedJob.application_deadline
        ? normalizedJob.application_deadline.split("T")[0]
        : "",
      start_date: normalizedJob.start_date
        ? normalizedJob.start_date.split("T")[0]
        : "",
      duration: normalizedJob.duration || "",
      vacancies: normalizedJob.vacancies || 1,
      is_active:
        normalizedJob.is_active !== undefined ? normalizedJob.is_active : true,
    });
    setShowForm(true);
  };

  const handleDelete = async (jobId) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);

      if (error) throw error;

      loadJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
    }
  };

  const handleToggleActive = async (jobId, isActive) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) throw error;

      loadJobs();
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      requirements: "",
      employment_type: "part_time",
      job_mode: "onsite",
      subject: "",
      grade_levels: [],
      city: "",
      location: "",
      schedule: "",
      salary_range: "",
      application_deadline: "",
      start_date: "",
      duration: "",
      vacancies: 1,
      is_active: true,
    });
    setEditingJob(null);
    setShowForm(false);
  };

  const isJobExpired = (deadline) => {
    return isDeadlineExpired(deadline);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1E00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1F1F1F]">My Job Postings</h2>
          <p className="text-gray-600">
            Manage your teaching and tutoring job postings
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!canPostJobs}
          className={`px-4 py-2 rounded-lg font-medium ${
            canPostJobs
              ? "bg-[#FF1E00] text-white hover:bg-[#E01B00]"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {canPostJobs ? "+ Post New Job" : "Verification Required"}
        </button>
      </div>

      {!canPostJobs && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
          <p className="text-sm font-semibold">Organization verification required</p>
          <p className="text-sm mt-1">
            {organizationVerification.status === "rejected"
              ? "Your verification request was rejected. Please update your legal registration details in your profile and contact support for re-review."
              : "Your verification request is pending admin review. Job posting will be enabled once approved."}
          </p>
          {organizationVerification.rejectionReason && (
            <p className="text-sm mt-1">
              Review note: {organizationVerification.rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* Job Posting Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-[#1F1F1F]">
              {editingJob ? "Edit Job" : "Post New Job"}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Job Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900 placeholder:text-gray-500"
                  required
                  placeholder="e.g., Mathematics Teacher Needed"
                />
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Employment Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900"
                  required
                >
                  {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {EMPLOYMENT_TYPE_LABEL_MAP[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Job Mode <span className="text-red-600">*</span>
                </label>
                <select
                  name="job_mode"
                  value={formData.job_mode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900"
                  required
                >
                  {JOB_MODE_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Subject <span className="text-red-600">*</span>
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900"
                  required
                >
                  <option value="">Select Subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vacancies */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Number of Vacancies
                </label>
                <input
                  type="number"
                  name="vacancies"
                  value={formData.vacancies}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City
                  {formData.job_mode !== "remote" && (
                    <span className="text-red-600">*</span>
                  )}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., Addis Ababa"
                  required={formData.job_mode !== "remote"}
                />
                {formData.job_mode === "remote" && (
                  <p className="mt-2 text-sm text-gray-600">
                    City is optional for remote jobs.
                  </p>
                )}
              </div>

              {/* Salary Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Salary Range
                </label>
                <input
                  type="text"
                  name="salary_range"
                  value={formData.salary_range}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., ETB 5,000 - 8,000 per month"
                />
              </div>

              {/* Application Deadline */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Application Deadline <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="application_deadline"
                  value={formData.application_deadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900"
                  required
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Expected Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Schedule
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., Monday-Friday, 8am-4pm"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., 6 months, 1 year"
                />
              </div>

              {/* Grade Levels - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Grade Levels
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {GRADE_LEVELS.map((level) => (
                    <div key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`level-${level}`}
                        value={level}
                        checked={formData.grade_levels.includes(level)}
                        onChange={handleInputChange}
                        name="grade_levels"
                        className="h-5 w-5 text-[#D10000] focus:ring-[#D10000] border-gray-400 rounded"
                      />
                      <label
                        htmlFor={`level-${level}`}
                        className="ml-3 text-sm font-medium text-gray-800"
                      >
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Description - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Job Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900 placeholder:text-gray-500"
                  required
                  placeholder="Describe the job responsibilities and expectations..."
                />
              </div>

              {/* Requirements - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Requirements (one per line){" "}
                  <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-[#D10000] bg-white text-gray-900 placeholder:text-gray-500"
                  required
                  placeholder="• Bachelor's degree in Education\n• 2+ years teaching experience\n• Fluent in English"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Enter each requirement on a new line. Use bullet points (•) or
                  dashes (-) if desired.
                </p>
              </div>
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-5 w-5 text-[#D10000] focus:ring-[#D10000] border-gray-400 rounded"
              />
              <label
                htmlFor="is_active"
                className="ml-3 text-sm font-medium text-gray-900"
              >
                Job is currently active and accepting applications
              </label>
            </div>

            {/* Required Fields Note */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Required Fields
                  </p>
                  <p className="text-sm text-blue-700">
                    Fields marked with{" "}
                    <span className="text-red-600 font-bold">*</span> are
                    required. Please ensure all required information is provided
                    before submitting.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Note:</span> All submitted jobs
                will be reviewed before going live.
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#D10000] text-white font-medium rounded-lg hover:bg-[#B00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D10000] shadow-sm"
                >
                  {editingJob ? "Update Job" : "Post Job"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-[#FF1E00]">
              {jobs.length}
            </div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {
                jobs.filter(
                  (j) => j.is_active && !isJobExpired(j.application_deadline),
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">Active Jobs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {jobs.filter((j) => isJobExpired(j.application_deadline)).length}
            </div>
            <div className="text-sm text-gray-600">Expired Jobs</div>
          </div>
        </div>

        {/* Jobs Table */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Jobs Posted Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Post your first job to find qualified teachers and tutors.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] font-medium"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => {
                    const expired = isJobExpired(job.application_deadline);
                    return (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {job.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {normalizeJobModel(job).job_type}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{job.subject}</div>
                          <div className="text-sm text-gray-500">
                            {Array.isArray(job.grade_levels) &&
                              job.grade_levels.join(", ")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`${expired ? "text-red-600" : "text-gray-900"}`}
                          >
                            {new Date(
                              job.application_deadline,
                            ).toLocaleDateString()}
                          </div>
                          {expired && (
                            <div className="text-xs text-red-500">Expired</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.is_active && !expired ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {job.is_active && !expired ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">0</div>
                          <div className="text-sm text-gray-500">
                            View applications
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(job)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleToggleActive(job.id, job.is_active)
                              }
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {job.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
