const PRIORITY_LABELS: Record<number, string> = {
  10: "None",
  20: "Low",
  30: "Normal",
  40: "High",
  50: "Urgent",
  60: "Immediate"
};

const PRIORITY_COLORS: Record<number, string> = {
  10: "badge-info",
  20: "badge-info",
  30: "badge-info",
  40: "badge-warning",
  50: "badge-warning",
  60: "badge-danger"
};

interface PriorityBadgeProps {
  priority: number;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const label = PRIORITY_LABELS[priority] || "Unknown";
  const colorClass = PRIORITY_COLORS[priority] || "badge-info";

  return <span className={`badge ${colorClass}`}>{label}</span>;
}
