// /app/dashboard/candidates/components/modal/ModalHeader.jsx
export default function ModalHeader({
  title,
  subtitle,
  status,
  getStatusColor,
  onClose,
}) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-300 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-secondary">{title}</h2>
          <p className="text-sm text-gray-700 font-medium">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(status)}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-secondary p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
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
    </div>
  );
}
