export default function StatBox({
  value,
  label,
  bgColor = "bg-gray-50",
  textColor = "text-secondary",
  borderColor = "border-gray-200",
}) {
  return (
    <div
      className={`text-center p-2 ${bgColor} rounded-lg border ${borderColor}`}
    >
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      <div className={`text-xs ${textColor} font-medium`}>{label}</div>
    </div>
  );
}
