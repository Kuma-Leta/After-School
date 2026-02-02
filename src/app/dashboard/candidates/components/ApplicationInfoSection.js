// /app/dashboard/candidates/components/modal/sections/ApplicationInfoSection.jsx
export default function ApplicationInfoSection({ application, formatDate }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-secondary mb-3">
        Application Information
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <InfoBox
          label="Applied Date"
          value={formatDate(application.submitted_at)}
        />
        <InfoBox
          label="Last Updated"
          value={formatDate(application.updated_at) || "Not updated"}
        />
        {application.resume_url && (
          <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-300">
            <div className="text-sm text-gray-700 mb-1 font-semibold">
              Resume
            </div>
            <a
              href={application.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:text-primary/80 font-semibold"
            >
              <svg
                className="w-4 h-4 mr-2"
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
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
      <div className="text-sm text-gray-700 mb-1 font-semibold">{label}</div>
      <div className="font-semibold text-secondary">{value}</div>
    </div>
  );
}
