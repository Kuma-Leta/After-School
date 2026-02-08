// app/dashboard/candidates/components/JobList/EmptyState.js
"use client";

import { Briefcase, PlusCircle, Bell } from "lucide-react";

export default function JobListEmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto max-w-md">
        <div className="h-24 w-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <Briefcase className="h-12 w-12 text-blue-600" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Jobs with Applications
        </h3>

        <p className="text-gray-600 mb-6">
          You haven't posted any jobs yet, or your existing jobs don't have any
          applications.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-800">Tip</p>
              <p className="text-sm text-blue-700">
                Post a job to start receiving applications from qualified
                candidates.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href="/dashboard/jobs/post"
            className="block py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <PlusCircle className="h-5 w-5 inline mr-2" />
            Post a New Job
          </a>

          <a
            href="/dashboard/jobs"
            className="block py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            View All Jobs
          </a>
        </div>
      </div>
    </div>
  );
}
