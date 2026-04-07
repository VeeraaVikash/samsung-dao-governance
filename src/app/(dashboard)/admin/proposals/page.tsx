"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminProposalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/proposals").then(r => r.json()).then(setProposals).catch(() => {});
  }, []);

  if (loading || !user) return null;

  const statuses = ["DRAFT", "PENDING", "APPROVED", "EXECUTING", "COMPLETED", "REJECTED"];
  const filtered = filter === "all" ? proposals : proposals.filter(p => p.status === filter);

  const pipelineCounts: Record<string, number> = {};
  statuses.forEach(s => { pipelineCounts[s] = proposals.filter(p => p.status === s).length; });

  return (
    <DashboardLayout role="ADMIN">
      <h2 className="text-xl heading mb-1">Proposal Pipeline</h2>
      <p className="text-xs text-gray-400 mb-5">{proposals.length} total proposals across all stages</p>

      {/* Pipeline overview */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === "all" ? "bg-samsung-primary text-white" : "bg-white border-thin border-gray-200 text-gray-500"}`}>
          All ({proposals.length})
        </button>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${filter === s ? "bg-samsung-primary text-white" : "bg-white border-thin border-gray-200 text-gray-500"}`}>
            {s.toLowerCase()} ({pipelineCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Proposals */}
      <div className="card">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No proposals in this stage.</p>
        ) : filtered.map((p, i) => (
          <div key={p.id} className={`flex justify-between items-center py-3 px-4 ${i < filtered.length - 1 ? "border-b border-thin border-gray-200" : ""}`}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[11px] text-gray-400 font-medium">P-{p.number}</span>
                <span className="text-[13px] font-medium text-gray-700">{p.title}</span>
              </div>
              <div className="text-[11px] text-gray-400">
                {p.author?.name} · {p.author?.department} · {new Date(p.createdAt).toLocaleDateString()}
              </div>
            </div>
            <StatusBadge status={p.status.toLowerCase()} />
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
