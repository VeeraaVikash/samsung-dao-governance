"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Download } from "lucide-react";

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<any[]>([]);
  const [users, setUsers] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/proposals").then(r => r.json()).then(setProposals).catch(() => {});
    fetch("/api/users?mode=registry").then(r => r.json()).then(setUsers).catch(() => {});
  }, []);

  if (loading || !user) return null;

  const stats = users?.stats || { total: 0, proposers: 0, delegates: 0, kycVerified: 0, walletsBound: 0 };

  function exportCSV() {
    const headers = "Metric,Value\n";
    const rows = [
      `Total Members,${stats.total}`,
      `Proposers,${stats.proposers}`,
      `Delegates,${stats.delegates}`,
      `KYC Verified,${stats.kycVerified}`,
      `Wallets Bound,${stats.walletsBound}`,
      `Total Proposals,${proposals.length}`,
      `Approved,${proposals.filter((p: any) => p.status === "APPROVED").length}`,
      `Pending,${proposals.filter((p: any) => p.status === "PENDING").length}`,
      `Draft,${proposals.filter((p: any) => p.status === "DRAFT").length}`,
      `Rejected,${proposals.filter((p: any) => p.status === "REJECTED").length}`,
    ].join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `samsung-dao-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const metricGroups = [
    {
      title: "Member Metrics",
      metrics: [
        { label: "Total members", value: stats.total },
        { label: "Proposers", value: stats.proposers },
        { label: "Delegates", value: stats.delegates },
        { label: "KYC verified", value: stats.kycVerified, pct: stats.total > 0 ? ((stats.kycVerified / stats.total) * 100).toFixed(1) + "%" : "—" },
        { label: "Wallets bound", value: stats.walletsBound, pct: stats.total > 0 ? ((stats.walletsBound / stats.total) * 100).toFixed(1) + "%" : "—" },
      ],
    },
    {
      title: "Proposal Metrics",
      metrics: [
        { label: "Total proposals", value: proposals.length },
        { label: "Approved", value: proposals.filter((p: any) => p.status === "APPROVED").length },
        { label: "Pending review", value: proposals.filter((p: any) => p.status === "PENDING").length },
        { label: "Draft", value: proposals.filter((p: any) => p.status === "DRAFT").length },
        { label: "Rejected", value: proposals.filter((p: any) => p.status === "REJECTED").length },
      ],
    },
    {
      title: "Governance Metrics",
      metrics: [
        { label: "Current period", value: "#7" },
        { label: "Active rules", value: 12 },
        { label: "Quorum threshold", value: "51%" },
        { label: "Timelock window", value: "48h" },
        { label: "Multisig requirement", value: "3-of-5" },
      ],
    },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl heading">Analytics Export</h2>
          <p className="text-xs text-gray-400">Platform metrics and governance data</p>
        </div>
        <button onClick={exportCSV} className="btn-primary text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {metricGroups.map(group => (
        <div key={group.title} className="card p-5 mb-4">
          <h3 className="text-sm heading mb-3">{group.title}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {group.metrics.map(m => (
              <div key={m.label} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{m.value}</div>
                <div className="text-[11px] text-gray-400 mt-1">{m.label}</div>
                {(m as any).pct && <div className="text-[10px] font-mono text-success mt-0.5">{(m as any).pct}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </DashboardLayout>
  );
}
