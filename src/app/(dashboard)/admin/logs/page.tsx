"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface LogEntry {
  id: string; timestamp: string; contractName: string; eventType: string;
  details: string; txHash: string | null;
}

export default function LogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/logs").then(r => r.json()).then(setLogs).catch(() => {});
    // Poll every 10s
    const t = setInterval(() => {
      fetch("/api/logs").then(r => r.json()).then(setLogs).catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, []);

  if (loading || !user) return null;

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl heading">Contract Event Log</h2>
          <p className="text-xs text-gray-400">Live feed from Hedera testnet · Auto-refreshes every 10s</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-gray-400 font-mono">LIVE</span>
        </div>
      </div>

      <div className="card">
        <div className="font-mono text-[11px]">
          <div className="flex gap-2 px-3 py-2 bg-gray-50 border-b border-thin border-gray-200">
            <span className="min-w-[80px] eyebrow">Time</span>
            <span className="min-w-[140px] eyebrow">Contract</span>
            <span className="min-w-[110px] eyebrow">Event</span>
            <span className="flex-1 eyebrow">Details</span>
            <span className="min-w-[100px] eyebrow text-right">TX Hash</span>
          </div>
          {logs.map((l) => (
            <div key={l.id} className="flex gap-2 px-3 py-2 border-b border-thin border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
              <span className="text-gray-400 min-w-[80px]">
                {new Date(l.timestamp).toLocaleTimeString("en-GB")}
              </span>
              <span className="text-samsung-primary min-w-[140px] font-medium">{l.contractName}</span>
              <span className="text-gray-500 min-w-[110px]">{l.eventType}</span>
              <span className="text-gray-500 flex-1">{l.details}</span>
              <span className="text-gray-400 min-w-[100px] text-right">{l.txHash || "—"}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-400">No logs yet.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
