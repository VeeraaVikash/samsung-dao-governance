"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Save } from "lucide-react";

export default function VotingConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rules, setRules] = useState<any>(null);
  const [votingWindow, setVotingWindow] = useState(72);
  const [minRep, setMinRep] = useState(100);
  const [quorum, setQuorum] = useState(51);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/auth/login"); if (!loading && user && user.role !== "COUNCIL") router.push("/"); }, [loading, user, router]);
  useEffect(() => { fetch("/api/governance").then(r => r.json()).then(d => { if (d) { setRules(d); setVotingWindow(d.votingWindowHours); setMinRep(d.minReputationScore); setQuorum(d.quorumThreshold); } }).catch(() => {}); }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/governance", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votingWindowHours: votingWindow, minReputationScore: minRep, quorumThreshold: quorum }) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  if (loading || !user) return null;
  return (
    <DashboardLayout role="COUNCIL">
      <h2 className="text-xl heading mb-1">Voting Configuration</h2>
      <p className="text-xs text-gray-400 mb-5">Configure voting parameters for the current governance period</p>
      <div className="card p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Voting window (hours)</label>
            <input type="number" value={votingWindow} onChange={e => setVotingWindow(Number(e.target.value))} min={1} max={720}
              className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary" /></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Min. reputation to vote</label>
            <input type="number" value={minRep} onChange={e => setMinRep(Number(e.target.value))} min={0} max={10000}
              className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary" /></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Quorum threshold (%)</label>
            <input type="number" value={quorum} onChange={e => setQuorum(Number(e.target.value))} min={1} max={100}
              className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary" /></div>
        </div>
        <div className="flex justify-between items-center">
          {saved ? <span className="text-xs text-success font-medium">✓ Saved successfully</span> : <span className="text-xs text-gray-400">Modify values and save to apply</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2"><Save className="w-4 h-4" />{saving ? "Saving..." : "Save config"}</button>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="text-sm heading mb-3">Voting Rules</h3>
        {[["Wallet binding required", "Members must have a bound Hedera wallet to vote", true],
          ["One vote per member per election", "Duplicate votes are rejected at contract level", true],
          ["Votes are final", "Once cast, votes cannot be changed or withdrawn", true],
          ["Results visible after close", "Vote counts hidden until the voting window closes", true],
        ].map(([label, desc, enforced], i) => (
          <div key={i} className="flex justify-between items-center py-2.5 border-b border-thin border-gray-200 last:border-b-0">
            <div><div className="text-[13px] text-gray-700">{label as string}</div><div className="text-[11px] text-gray-400">{desc as string}</div></div>
            <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-success-light text-success">Enforced</span>
          </div>))}
      </div>
    </DashboardLayout>);
}
