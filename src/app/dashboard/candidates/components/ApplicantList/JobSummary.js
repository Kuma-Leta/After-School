// app/dashboard/candidates/components/ApplicantList/JobSummary.js
"use client";

import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  BookOpen,
} from "lucide-react";

export default function JobSummary({ job, applicantCount }) {
  if (!job) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
              {job.is_filled && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Position Filled
                </span>
              )}
              {job.is_active === false && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  Inactive
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center text-gray-600">
                <Briefcase className="h-4 w-4 mr-2" />
                <span>{job.job_type}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{job.location}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>{job.subject}</span>
              </div>

              {job.salary_range && (
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>{job.salary_range}</span>
                </div>
              )}

              {job.schedule && (
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{job.schedule}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {applicantCount}
                  </div>
                  <div className="text-sm text-gray-500">Applicants</div>
                </div>

                <div className="h-10 w-px bg-gray-200"></div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {job.vacancies || 1}
                  </div>
                  <div className="text-sm text-gray-500">Vacancies</div>
                </div>

                <div className="h-10 w-px bg-gray-200"></div>

                <div className="text-center">
                  <div className="text-sm text-gray-500">Deadline</div>
                  <div className="text-sm font-medium text-gray-900">
                    {job.application_deadline
                      ? new Date(job.application_deadline).toLocaleDateString()
                      : "Open"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {job.description && (
          <div className="mt-4">
            <p className="text-gray-600 line-clamp-2">{job.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
