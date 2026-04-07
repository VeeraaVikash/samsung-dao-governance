"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Download } from "lucide-react";

interface LogEntry {
  id: string; timestamp: string; contractName: string; eventType: string;
  details: string; txHash: string | null;
}

export default function AuditTrailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/logs").then(r => r.json()).then(setLogs).catch(() => {});
  }, []);

  if (loading || !user) return null;

  const filtered = filter
    ? logs.filter(l => l.contractName.toLowerCase().includes(filter.toLowerCase()) || l.eventType.toLowerCase().includes(filter.toLowerCase()) || l.details.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  function exportAuditCSV() {
    const headers = "Timestamp,Contract,Event,Details,TX Hash\n";
    const rows = filtered.map(l =>
      `"${new Date(l.timestamp).toISOString()}","${l.contractName}","${l.eventType}","${l.details}","${l.txHash || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl heading">Audit Trail</h2>
          <p className="text-xs text-gray-400">{logs.length} events recorded · Immutable on-chain log</p>
        </div>
        <button onClick={exportAuditCSV} className="btn-primary text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter by contract, event, or details..."
          className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
      </div>

      <div className="card overflow-x-auto">
        <div className="flex gap-2 px-4 py-2.5 bg-gray-50 border-b border-thin border-gray-200 font-mono">
          <span className="eyebrow min-w-[140px]">Timestamp</span>
          <span className="eyebrow min-w-[140px]">Contract</span>
          <span className="eyebrow min-w-[130px]">Event</span>
          <span className="eyebrow flex-1">Details</span>
          <span className="eyebrow min-w-[100px] text-right">TX Hash</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No matching events.</p>
        ) : filtered.map((l, i) => (
          <div key={l.id} className={`flex gap-2 px-4 py-2.5 font-mono text-[11px] ${i < filtered.length - 1 ? "border-b border-thin border-gray-200" : ""} hover:bg-gray-50 transition-colors`}>
            <span className="text-gray-400 min-w-[140px]">{new Date(l.timestamp).toLocaleString()}</span>
            <span className="text-samsung-primary font-medium min-w-[140px]">{l.contractName}</span>
            <span className="text-gray-500 min-w-[130px]">{l.eventType}</span>
            <span className="text-gray-600 flex-1">{l.details}</span>
            <span className="text-gray-400 min-w-[100px] text-right">{l.txHash || "—"}</span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
