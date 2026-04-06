"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function NewProposalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  if (loading || !user) return null;

  async function handleCreate() {
    if (title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
    if (description.trim().length < 10) { setError("Description must be at least 10 characters."); return; }
    setCreating(true); setError("");
    const res = await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() }) });
    if (res.ok) { router.push("/member/proposals"); }
    else { const d = await res.json(); setError(d.error || "Failed to create"); }
    setCreating(false);
  }

  return (
    <DashboardLayout role="MEMBER">
      <h2 className="text-xl heading mb-5">Create New Proposal</h2>
      <div className="card p-5 max-w-[600px]">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title (min 5 characters)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q3 SPU token reward increase"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Description (min 10 characters)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail — what change you're proposing, why it matters, and expected impact."
              rows={6} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary resize-none" />
          </div>
          {error && <div className="bg-danger-light text-danger text-xs rounded-lg px-3 py-2">{error}</div>}
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary text-sm">{creating ? "Submitting…" : "Submit as draft"}</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
