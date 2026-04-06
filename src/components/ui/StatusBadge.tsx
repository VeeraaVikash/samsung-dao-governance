const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-400",
  pending: "bg-warning-light text-warning",
  approved: "bg-success-light text-success",
  executing: "bg-samsung-light text-samsung-primary",
  completed: "bg-samsung-light text-samsung-mid",
  rejected: "bg-danger-light text-danger",
  live: "bg-danger text-white",
  active: "bg-success-light text-success",
  upcoming: "bg-samsung-light text-samsung-primary",
  closed: "bg-gray-100 text-gray-400",
  review: "bg-warning-light text-warning",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const style = statusStyles[key] || statusStyles.draft;

  return (
    <span className={`font-mono text-[10px] font-semibold capitalize px-2 py-0.5 rounded ${style} tracking-wide`}>
      {label || status}
    </span>
  );
}
