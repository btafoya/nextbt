const STATUS_LABELS: Record<number, string> = {
  10: "New",
  20: "Feedback",
  30: "Acknowledged",
  40: "Confirmed",
  50: "Assigned",
  80: "Resolved",
  90: "Closed"
};

const STATUS_COLORS: Record<number, string> = {
  10: "badge-info",
  20: "badge-warning",
  30: "badge-info",
  40: "badge-info",
  50: "badge-warning",
  80: "badge-success",
  90: "badge-success"
};

interface StatusBadgeProps {
  status: number;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || "Unknown";
  const colorClass = STATUS_COLORS[status] || "badge-info";

  return <span className={`badge ${colorClass}`}>{label}</span>;
}
