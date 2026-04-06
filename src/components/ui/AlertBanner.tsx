import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  message: string;
  detail?: string;
  severity?: "warning" | "danger";
}

export function AlertBanner({ message, detail, severity = "warning" }: AlertBannerProps) {
  const bg = severity === "danger" ? "bg-danger-light border-danger/20" : "bg-warning-light border-warning/20";
  return (
    <div className={`${bg} rounded-xl px-4 py-3 flex items-center gap-3 border-thin`}>
      <AlertTriangle className="w-[18px] h-[18px] text-warning shrink-0" />
      <span className="text-[13px] text-gray-700 flex-1">
        <strong>{message}</strong>
        {detail && <> — {detail}</>}
      </span>
      <button className="btn-secondary text-xs px-3 py-1">View details</button>
    </div>
  );
}
