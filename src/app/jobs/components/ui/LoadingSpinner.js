// components/ui/LoadingSpinner.js
export function LoadingSpinner({ size = "md" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  return (
    <div
      className={`animate-spin rounded-full border-4 border-solid border-gray-200 border-t-[#FF1E00] ${sizeClasses[size]}`}
    ></div>
  );
}

export default LoadingSpinner;
