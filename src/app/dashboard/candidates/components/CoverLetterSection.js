// /app/dashboard/candidates/components/modal/sections/CoverLetterSection.jsx
export default function CoverLetterSection({ coverLetter }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-secondary mb-3 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Cover Letter
      </h3>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
        <p className="text-gray-800 whitespace-pre-line font-medium">
          {coverLetter || "No cover letter provided."}
        </p>
      </div>
    </div>
  );
}
