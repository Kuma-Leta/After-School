export default function Avatar({ initials, size = "md" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-800 font-bold border-2 border-blue-200`}
    >
      {initials}
    </div>
  );
}
