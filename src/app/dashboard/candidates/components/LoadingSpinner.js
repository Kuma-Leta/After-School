// components/LoadingSpinner.jsx
export default function LoadingSpinner() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-gray-600">Loading candidates...</p>
    </div>
  );
}
