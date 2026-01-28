// app/components/JobDetailModal.js
"use client";

import { useEffect } from "react";

export default function JobDetailModal({ job, onClose, onApply }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const daysLeft = Math.ceil(
    (new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {job.title}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {job.job_type}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {job.subject}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {job.location}
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {job.salary_range || "Negotiable"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Job Description */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Job Description</h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">
                  Requirements & Qualifications
                </h3>
                <ul className="space-y-2">
                  {Array.isArray(job.requirements) &&
                  job.requirements.length > 0 ? (
                    job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{req}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-600">
                      No specific requirements listed
                    </li>
                  )}
                </ul>
              </div>

              {/* Responsibilities */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">
                  Key Responsibilities
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-[#FF1E00] rounded-full mr-3 mt-2"></div>
                    <span>
                      Deliver high-quality instruction in {job.subject}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-[#FF1E00] rounded-full mr-3 mt-2"></div>
                    <span>Prepare lesson plans and teaching materials</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-[#FF1E00] rounded-full mr-3 mt-2"></div>
                    <span>Assess student progress and provide feedback</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-[#FF1E00] rounded-full mr-3 mt-2"></div>
                    <span>
                      Participate in staff meetings and professional development
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Job Overview */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Job Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Posted Date</div>
                    <div className="font-medium">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      Application Deadline
                    </div>
                    <div
                      className={`font-medium ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-yellow-600" : "text-green-600"}`}
                    >
                      {new Date(job.application_deadline).toLocaleDateString()}{" "}
                      ({daysLeft} days left)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Job Type</div>
                    <div className="font-medium">{job.job_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-medium">
                      {job.duration || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Schedule</div>
                    <div className="font-medium">
                      {job.schedule || "Flexible"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Vacancies</div>
                    <div className="font-medium">
                      {job.vacancies || 1} position
                      {job.vacancies > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Salary</div>
                    <div className="font-medium text-[#FF1E00]">
                      {job.salary_range || "Negotiable"}
                    </div>
                  </div>
                  {Array.isArray(job.grade_levels) &&
                    job.grade_levels.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600">
                          Grade Levels
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {job.grade_levels.map((level) => (
                            <span
                              key={level}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {level}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Employer Info */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Employer Information
                </h3>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <span className="text-2xl">
                      {job.organizations?.org_type === "school"
                        ? "🏫"
                        : job.organizations?.org_type === "ngo"
                          ? "🤝"
                          : "👨‍👩‍👧"}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">
                      {job.organizations?.org_name || "Private Employer"}
                    </div>
                    <div className="text-gray-600 capitalize">
                      {job.organizations?.org_type || "Organization"}
                    </div>
                    {job.organizations?.verified && (
                      <div className="flex items-center text-green-600 text-sm mt-1">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified Employer
                      </div>
                    )}
                  </div>
                </div>
                {job.organizations?.contact_person && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-600">Contact Person</div>
                    <div className="font-medium">
                      {job.organizations.contact_person}
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <button
                onClick={onApply}
                className="w-full py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] font-bold text-lg shadow-lg"
              >
                Apply for this Job
              </button>
              <div className="text-center mt-4 text-sm text-gray-600">
                {daysLeft > 0
                  ? `Apply before ${new Date(job.application_deadline).toLocaleDateString()}`
                  : "Application deadline has passed"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
