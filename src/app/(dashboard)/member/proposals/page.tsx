"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Proposal {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  author: { name: string; employeeId: string };
}

export default function ProposalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    loadProposals();
  }, []);

  function loadProposals() {
    fetch("/api/proposals").then((r) => r.json()).then(setProposals).catch(() => {});
  }

  async function handleCreate() {
    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    setCreating(true);
    setError("");

    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() }),
    });

    if (res.ok) {
      setTitle("");
      setDescription("");
      setShowCreate(false);
      loadProposals();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create proposal");
    }
    setCreating(false);
  }

  if (loading || !user) return null;

  return (
    <DashboardLayout role="MEMBER">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl heading">Proposals</h2>
          <span className="text-xs text-gray-400">{proposals.length} total proposals</span>
        </div>
        {user.memberType === "PROPOSER" && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
            {showCreate ? "Cancel" : "+ Create proposal"}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card mb-5 p-5">
          <h3 className="text-sm heading mb-3">New Proposal</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title (min 5 characters)"
                className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your proposal in detail (min 10 characters)..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary resize-none"
              />
            </div>
            {error && <div className="bg-danger-light text-danger text-xs rounded-lg px-3 py-2">{error}</div>}
            <button onClick={handleCreate} disabled={creating} className="btn-primary w-full">
              {creating ? "Submitting…" : "Submit as draft"}
            </button>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="card">
        {proposals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No proposals yet.</p>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="flex justify-between items-center py-3 border-b border-thin border-gray-200 last:border-b-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[11px] text-gray-400 font-medium">P-{p.number}</span>
                  <span className="text-[13px] font-medium text-gray-700">{p.title}</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  {p.author.name} · {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
              <StatusBadge status={p.status.toLowerCase()} />
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
