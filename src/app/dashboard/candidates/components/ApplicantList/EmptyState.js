// app/dashboard/candidates/components/ApplicantList/EmptyState.js
"use client";

import { Users, FileText, Calendar } from "lucide-react";

export default function EmptyState({ job }) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto max-w-md">
        <div className="h-24 w-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <Users className="h-12 w-12 text-blue-600" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Applicants Yet
        </h3>

        <p className="text-gray-600 mb-6">
          No one has applied for "{job?.title}" yet. When applicants apply,
          they'll appear here.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Share the job link</p>
            </div>

            <div className="text-center">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Promote on social media</p>
            </div>

            <div className="text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Network with candidates</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() =>
              (window.location.href = `/dashboard/jobs/${job?.id}/edit`)
            }
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Edit Job Posting
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Back to All Jobs
          </button>
        </div>
      </div>
    </div>
  );
}
