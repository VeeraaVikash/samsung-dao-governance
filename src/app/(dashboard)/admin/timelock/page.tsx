"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";

const timelockQueue = [
  { id: "tl-1", proposal: "P-11", title: "Update delegation rules", status: "pending" as const, initiatedAt: "2025-04-04T06:21:03", expiresAt: "2025-04-06T06:21:03", initiator: "Park Soo-yeon", hoursLeft: 38 },
];

const timelockHistory = [
  { id: "tl-h1", proposal: "P-9", title: "Increase quorum for treasury votes", status: "executed" as const, initiatedAt: "2025-03-28T10:00:00", executedAt: "2025-03-30T10:00:00" },
  { id: "tl-h2", proposal: "P-8", title: "Add new council member seat", status: "executed" as const, initiatedAt: "2025-03-20T14:30:00", executedAt: "2025-03-22T14:30:00" },
  { id: "tl-h3", proposal: "P-7", title: "Reduce minimum reputation to 75", status: "expired" as const, initiatedAt: "2025-03-15T09:00:00", executedAt: "2025-03-17T09:00:00" },
];

export default function TimelockPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <DashboardLayout role="ADMIN">
      <h2 className="text-xl heading mb-1">Timelock Status</h2>
      <p className="text-xs text-gray-400 mb-5">48-hour mandatory delay on all governance executions</p>

      {/* Config */}
      <div className="card p-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-samsung-primary" />
          <div>
            <div className="text-sm font-medium text-gray-700">Timelock window</div>
            <div className="text-xs text-gray-400">All approved proposals must wait before execution</div>
          </div>
        </div>
        <span className="font-mono text-lg font-bold text-samsung-primary">48h</span>
      </div>

      {/* Active Queue */}
      <h3 className="text-sm heading mb-3">Active Queue ({timelockQueue.length})</h3>
      {timelockQueue.map(tl => (
        <div key={tl.id} className="card p-5 mb-3 border-[1.5px] border-warning/40">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-gray-400">{tl.proposal}</span>
                <span className="text-sm font-semibold text-gray-900">{tl.title}</span>
              </div>
              <span className="text-[11px] text-gray-400">Initiated by {tl.initiator} · {new Date(tl.initiatedAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-mono text-sm font-bold">{tl.hoursLeft}h left</span>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
            <span>Initiated</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-warning rounded-full" style={{ width: `${((48 - tl.hoursLeft) / 48) * 100}%` }} />
            </div>
            <span>Executable</span>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-gray-400">
            <span>{new Date(tl.initiatedAt).toLocaleString()}</span>
            <span>{new Date(tl.expiresAt).toLocaleString()}</span>
          </div>
        </div>
      ))}

      {/* History */}
      <h3 className="text-sm heading mb-3 mt-6">History</h3>
      <div className="card">
        {timelockHistory.map((tl, i) => (
          <div key={tl.id} className={`flex justify-between items-center py-3 px-4 ${i < timelockHistory.length - 1 ? "border-b border-thin border-gray-200" : ""}`}>
            <div className="flex items-center gap-3">
              {tl.status === "executed" ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-gray-400">{tl.proposal}</span>
                  <span className="text-[13px] text-gray-700">{tl.title}</span>
                </div>
                <span className="text-[11px] text-gray-400">{new Date(tl.initiatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
              tl.status === "executed" ? "bg-success-light text-success" : "bg-gray-100 text-gray-400"
            }`}>{tl.status}</span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
