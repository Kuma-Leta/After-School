// components/candidates/EmptyState.jsx
export function NoJobsState({ router }) {
  return (
    <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-gray-50 rounded-xl">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
        <span className="text-gray-400 text-4xl">📭</span>
      </div>
      <h3 className="text-xl font-semibold text-secondary mb-3">
        No Applications Yet
      </h3>
      <p className="text-gray-700 max-w-md mx-auto mb-8">
        Your posted jobs don&apos;t have any applications yet. Share your job
        posts to attract candidates.
      </p>
      <button
        onClick={() => router.push("/dashboard/jobs/post")}
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-md"
      >
        Create New Job Post
      </button>
    </div>
  );
}

export function NoApplicantsState({ goBackToJobs, router, selectedJob }) {
  return (
    <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-gray-50 rounded-xl">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
        <span className="text-gray-400 text-4xl">👤</span>
      </div>
      <h3 className="text-xl font-semibold text-secondary mb-3">
        No Applicants Found
      </h3>
      <p className="text-gray-700 max-w-md mx-auto mb-8 font-medium">
        This job doesn&apos;t have any applicants yet. Consider promoting your
        job post.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={goBackToJobs}
          className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold border border-gray-300 shadow-sm"
        >
          Back to Jobs
        </button>
        <button
          onClick={() => router.push(`/jobs/${selectedJob?.id}`)}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-md"
        >
          View Job Post
        </button>
      </div>
    </div>
  );
}
