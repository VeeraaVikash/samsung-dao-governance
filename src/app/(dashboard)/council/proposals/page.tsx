"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Proposal {
  id: string; number: number; title: string; description: string;
  status: string; createdAt: string;
  author: { name: string; employeeId: string; department: string };
}

export default function CouncilProposalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selected, setSelected] = useState<Proposal | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "COUNCIL") router.push("/");
  }, [loading, user, router]);

  useEffect(() => { loadProposals(); }, []);

  function loadProposals() {
    fetch("/api/proposals").then(r => r.json()).then(setProposals).catch(() => {});
  }

  async function updateStatus(id: string, newStatus: string) {
    const res = await fetch("/api/proposals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) { loadProposals(); setSelected(null); }
    else { const d = await res.json(); alert(d.error); }
  }

  if (loading || !user) return null;

  return (
    <DashboardLayout role="COUNCIL">
      <h2 className="text-xl heading mb-1">Proposal Review</h2>
      <p className="text-xs text-gray-400 mb-5">Review and approve submitted proposals</p>

      <div className="flex flex-col lg:flex-row gap-4"><div className="flex-1">
          {proposals.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              className={`card mb-2 cursor-pointer transition-colors ${selected?.id === p.id ? "border-samsung-primary border-[1.5px]" : "hover:border-gray-300"}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[11px] text-gray-400 font-medium">P-{p.number}</span>
                    <span className="text-[13px] font-medium text-gray-700">{p.title}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{p.author.name} · {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={p.status.toLowerCase()} />
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="w-full lg:w-[340px] card p-5 sticky top-[100px] self-start">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] text-gray-400">P-{selected.number}</span>
              <StatusBadge status={selected.status.toLowerCase()} />
            </div>
            <h3 className="text-base heading mb-2">{selected.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">{selected.description}</p>
            <div className="flex flex-col gap-1.5 mb-4 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Author</span><span className="text-gray-700">{selected.author.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Department</span><span className="text-gray-700">{selected.author.department}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Submitted</span><span className="text-gray-700">{new Date(selected.createdAt).toLocaleString()}</span></div>
            </div>
            {(selected.status === "DRAFT" || selected.status === "PENDING") && (
              <div className="flex gap-2">
                <button onClick={() => updateStatus(selected.id, "APPROVED")} className="btn-primary flex-1 text-sm">Approve</button>
                <button onClick={() => updateStatus(selected.id, "REJECTED")} className="flex-1 py-2 rounded-lg border-thin border-danger/40 text-danger text-sm font-semibold hover:bg-danger-light transition-colors">Reject</button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
