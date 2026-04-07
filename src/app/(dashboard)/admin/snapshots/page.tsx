"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Camera, CheckCircle } from "lucide-react";

const snapshots = [
  { id: "snap-1", event: "Council Election — Q2 2025", blockHeight: 72481200, memberCount: 847, timestamp: "2025-04-01T09:00:00", type: "election" },
  { id: "snap-2", event: "Proposal P-11 Voting", blockHeight: 72398450, memberCount: 831, timestamp: "2025-03-28T10:00:00", type: "proposal" },
  { id: "snap-3", event: "Council Election — Q1 2025", blockHeight: 71205300, memberCount: 792, timestamp: "2025-01-15T09:00:00", type: "election" },
  { id: "snap-4", event: "Proposal P-8 Voting", blockHeight: 70890100, memberCount: 780, timestamp: "2024-12-20T14:00:00", type: "proposal" },
  { id: "snap-5", event: "Governance Period #6 Start", blockHeight: 70102000, memberCount: 756, timestamp: "2024-11-01T09:00:00", type: "governance" },
  { id: "snap-6", event: "Council Election — Q4 2024", blockHeight: 69845200, memberCount: 741, timestamp: "2024-10-15T09:00:00", type: "election" },
];

export default function SnapshotHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <DashboardLayout role="ADMIN">
      <h2 className="text-xl heading mb-1">Snapshot History</h2>
      <p className="text-xs text-gray-400 mb-5">On-chain voter eligibility snapshots taken at specific block heights</p>

      <div className="card">
        <div className="flex gap-2 px-4 py-2.5 bg-gray-50 border-b border-thin border-gray-200">
          <span className="eyebrow flex-1">Event</span>
          <span className="eyebrow min-w-[120px]">Block Height</span>
          <span className="eyebrow min-w-[80px] text-right">Members</span>
          <span className="eyebrow min-w-[140px] text-right">Timestamp</span>
        </div>
        {snapshots.map((snap, i) => (
          <div key={snap.id} className={`flex items-center gap-2 px-4 py-3 ${i < snapshots.length - 1 ? "border-b border-thin border-gray-200" : ""} hover:bg-gray-50 transition-colors`}>
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                snap.type === "election" ? "bg-samsung-light" : snap.type === "proposal" ? "bg-warning-light" : "bg-success-light"
              }`}>
                <Camera className={`w-4 h-4 ${
                  snap.type === "election" ? "text-samsung-primary" : snap.type === "proposal" ? "text-warning" : "text-success"
                }`} />
              </div>
              <div>
                <div className="text-[13px] font-medium text-gray-700">{snap.event}</div>
                <div className="text-[11px] text-gray-400 capitalize">{snap.type} snapshot</div>
              </div>
            </div>
            <span className="font-mono text-xs text-samsung-primary font-medium min-w-[120px]">#{snap.blockHeight.toLocaleString()}</span>
            <span className="font-mono text-xs text-gray-700 min-w-[80px] text-right">{snap.memberCount}</span>
            <span className="text-[11px] text-gray-400 min-w-[140px] text-right">{new Date(snap.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 card p-4 flex items-center gap-3 bg-samsung-light/30">
        <CheckCircle className="w-4 h-4 text-samsung-primary shrink-0" />
        <span className="text-xs text-samsung-dark">
          All snapshots are immutable and stored on Hedera Consensus Service (HCS). Block heights can be independently verified via the Hedera mirror node.
        </span>
      </div>
    </DashboardLayout>
  );
}
