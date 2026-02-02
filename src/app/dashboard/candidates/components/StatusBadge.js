// components/common/StatusBadge.jsx
export default function StatusBadge({ status, getStatusColor }) {
  return (
    <span
      className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getStatusColor(status)}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
