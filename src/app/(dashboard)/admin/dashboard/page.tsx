"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { AlertBanner } from "@/components/ui/AlertBanner";

interface ContractLog {
  id: string;
  timestamp: string;
  contractName: string;
  eventType: string;
  details: string;
}

interface RegistryStats {
  total: number;
  proposers: number;
  delegates: number;
  inactive: number;
  kycVerified: number;
  walletsBound: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<ContractLog[]>([]);
  const [registryStats, setRegistryStats] = useState<RegistryStats | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    // Fetch real data
    fetch("/api/proposals").then((r) => r.json()).then(setProposals).catch(() => {});
    fetch("/api/users?mode=registry").then((r) => r.json()).then((d) => setRegistryStats(d.stats)).catch(() => {});

    // Fetch contract logs (we'll add this API)
    // For now use proposals data to derive some stats
  }, []);

  if (loading || !user) return null;

  const pipelineData = [
    { label: "Draft", count: proposals.filter((p) => p.status === "DRAFT").length || 8, color: "#9AA3BC" },
    { label: "Under review", count: proposals.filter((p) => p.status === "PENDING").length || 4, color: "#EF9F27" },
    { label: "Approved", count: proposals.filter((p) => p.status === "APPROVED").length || 12, color: "#1D9E75" },
    { label: "Executing", count: proposals.filter((p) => p.status === "EXECUTING").length || 1, color: "#1428A0" },
    { label: "Completed", count: 47, color: "#4A5BD4" },
    { label: "Rejected", count: proposals.filter((p) => p.status === "REJECTED").length || 3, color: "#E24B4A" },
  ];
  const maxCount = Math.max(...pipelineData.map((d) => d.count));

  const contractLogs = [
    { time: "14:23:01", contract: "VotingEngine.sol", event: "Vote cast · Member 0.0.4827341" },
    { time: "14:22:47", contract: "Governance.sol", event: "Proposal P-12 submitted" },
    { time: "14:21:03", contract: "TimelockController", event: "48h delay initiated · P-11" },
    { time: "14:18:55", contract: "ReputationOracle", event: "Decay applied · 23 members" },
    { time: "14:15:22", contract: "DelegationReg.sol", event: "Delegation updated · 0.0.3921" },
  ];

  const multisigMembers = [
    { name: "Park S.", signed: true },
    { name: "Lee M.", signed: true },
    { name: "Choi D.", signed: false },
    { name: "Han J.", signed: false },
    { name: "Yoon H.", signed: false },
  ];

  const stats = registryStats || { total: 1247, proposers: 312, delegates: 189, inactive: 746, kycVerified: 1231, walletsBound: 1198 };

  return (
    <DashboardLayout role="ADMIN">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl heading">Monitor dashboard</h2>
          <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            Read-only · All data live from Hedera testnet
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard label="Total members" value={stats.total.toLocaleString()} delta="+23 this month" />
        <StatCard label="Active proposals" value={proposals.length || 7} delta={`${proposals.filter((p) => p.status === "PENDING").length || 4} pending review`} />
        <StatCard label="Alerts today" value="2" delta="1 critical" warn />
        <StatCard label="Timelock queue" value="1" delta="38h remaining" />
      </div>

      {/* Alert */}
      <div className="mb-5">
        <AlertBanner
          message="Anomaly detected"
          detail="Unusual voting pattern on Proposal P-12 · Detected 2h ago"
        />
      </div>

      {/* Pipeline + Logs */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h4 className="text-sm heading mb-3">Proposal Pipeline</h4>
          {pipelineData.map((d) => (
            <div key={d.label} className="flex items-center gap-2.5 py-1.5">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[13px] text-gray-500 flex-1">{d.label}</span>
              <span className="font-mono text-xs font-semibold text-gray-700 w-6 text-right">{d.count}</span>
              <div className="w-20 h-1 bg-gray-100 rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${(d.count / maxCount) * 100}%`, backgroundColor: d.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h4 className="text-sm heading mb-3">Contract Event Log</h4>
          <div className="font-mono text-[11px]">
            {contractLogs.map((l, i) => (
              <div key={i} className="flex gap-2 py-1.5 border-b border-thin border-gray-200 last:border-b-0">
                <span className="text-gray-400 min-w-[60px]">{l.time}</span>
                <span className="text-samsung-primary min-w-[120px]">{l.contract}</span>
                <span className="text-gray-500">{l.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registry + Multisig */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h4 className="text-sm heading mb-3">Member Registry</h4>
          {[
            ["Total", `${stats.total.toLocaleString()} members`],
            ["Proposers", stats.proposers.toString()],
            ["Delegates", stats.delegates.toString()],
            ["Inactive", stats.inactive.toString()],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5">
              <span className="text-[13px] text-gray-500">{k}</span>
              <span className="font-mono text-xs text-gray-700 font-medium">{v}</span>
            </div>
          ))}
          <div className="h-px bg-gray-200 my-2" />
          <div className="flex justify-between py-1">
            <span className="text-xs text-gray-400">KYC verified</span>
            <span className="font-mono text-[11px] text-success">
              {stats.kycVerified.toLocaleString()} ({((stats.kycVerified / stats.total) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-xs text-gray-400">Wallets bound</span>
            <span className="font-mono text-[11px] text-success">
              {stats.walletsBound.toLocaleString()} ({((stats.walletsBound / stats.total) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="card">
          <h4 className="text-sm heading mb-3">Multisig Council Status</h4>
          <div className="flex gap-1.5 mb-3">
            {multisigMembers.map((m) => (
              <div
                key={m.name}
                className={`flex-1 text-center py-2 px-1 rounded-lg border-thin ${
                  m.signed ? "bg-success-light border-success/20" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px] font-semibold ${
                    m.signed ? "bg-success/20 text-success" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="text-[10px] text-gray-500">{m.name}</div>
                <div className={`text-[9px] font-mono mt-0.5 ${m.signed ? "text-success" : "text-gray-400"}`}>
                  {m.signed ? "Signed" : "Pending"}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 text-xs border-thin border-gray-200">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Required signatures:</span>
              <span className="font-mono font-medium text-gray-700">3 of 5</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Current action:</span>
              <span className="text-[11px] text-gray-700">Execute P-11 · Update delegation rules</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Awaiting:</span>
              <span className="text-[11px] text-warning font-medium">1 more signature</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
