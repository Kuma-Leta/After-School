"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UpgradePromptNotice from "@/components/payment/UpgradePromptNotice";

export default function ApplicationForm({ job, profile }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  const MAX_RESUME_SIZE = 5 * 1024 * 1024;
  const ALLOWED_RESUME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    cover_letter: "",
    resume_url: "", // We'll handle file upload separately
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setResumeFile(null);
      return;
    }

    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      setError("Please upload a valid resume file (PDF, DOC, or DOCX).");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      setError("Resume file size must be less than 5MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setResumeFile(file);
  };

  const uploadResume = async (file) => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const response = await fetch("/api/applications/upload-resume", {
      method: "POST",
      body: uploadFormData,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "Failed to upload resume.");
    }

    return payload?.resumeUrl || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let resolvedResumeUrl = formData.resume_url || "";
      if (resumeFile) {
        setUploadingResume(true);
        resolvedResumeUrl = await uploadResume(resumeFile);
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          coverLetter: formData.cover_letter,
          resumeUrl: resolvedResumeUrl,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload?.reason === "subscription_required_for_apply") {
          setShowPremiumPrompt(true);
        }
        throw new Error(payload?.error || "Failed to submit application.");
      }

      setSuccess("Application submitted successfully!");

      // Redirect to dashboard or applications page after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/applications");
      }, 2000);
    } catch (error) {
      console.error("Error submitting application:", error);
      setError(
        error.message || "Failed to submit application. Please try again.",
      );
    } finally {
      setUploadingResume(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Apply for {job.title}
      </h1>
      <p className="text-gray-600 mb-6">
        at {job.organizations.org_name} • {job.location}
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {showPremiumPrompt && (
        <div className="mb-4">
          <UpgradePromptNotice
            title="Premium Required To Apply"
            triggerLabel="premium_action_blocked"
            description="Applying for jobs is currently restricted for unpaid student/teacher accounts. Upgrade to apply and stay visible to employers."
            redirectTo={`/jobs/${job.id}/apply`}
            onDismiss={() => setShowPremiumPrompt(false)}
          />
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter *
          </label>
          <textarea
            name="cover_letter"
            value={formData.cover_letter}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="Write your cover letter here. Explain why you are a good fit for this job..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CV / Resume (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Upload a PDF or Word document to include in your application.
          </p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FF1E00] file:text-white hover:file:bg-[#E01B00]"
          />
          {resumeFile && (
            <p className="mt-2 text-sm text-green-700">
              Selected: {resumeFile.name}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingResume}
            className="px-8 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
          >
            {submitting || uploadingResume ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {uploadingResume ? "Uploading CV..." : "Submitting..."}
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
