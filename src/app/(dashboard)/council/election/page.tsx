"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Plus, Trash2 } from "lucide-react";

export default function ElectionSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [elections, setElections] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [electionType, setElectionType] = useState("SINGLE_CHOICE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requireRep, setRequireRep] = useState(true);
  const [allowDelegation, setAllowDelegation] = useState(true);
  const [snapshot, setSnapshot] = useState(false);
  const [candidates, setCandidates] = useState([{ name: "", department: "" }, { name: "", department: "" }]);

  useEffect(() => { if (!loading && !user) router.push("/auth/login"); if (!loading && user && user.role !== "COUNCIL") router.push("/"); }, [loading, user, router]);
  useEffect(() => { loadElections(); }, []);
  function loadElections() { fetch("/api/elections").then(r => r.json()).then(setElections).catch(() => {}); }
  function addCandidate() { setCandidates([...candidates, { name: "", department: "" }]); }
  function removeCandidate(i: number) { if (candidates.length > 2) setCandidates(candidates.filter((_, idx) => idx !== i)); }
  function updateCandidate(i: number, field: "name" | "department", value: string) { setCandidates(candidates.map((c, idx) => idx === i ? { ...c, [field]: value } : c)); }

  async function handleCreate() {
    setError("");
    if (!title || !startDate || !endDate) { setError("Title, start date, and end date are required."); return; }
    if (candidates.some(c => !c.name || !c.department)) { setError("All candidates need a name and department."); return; }
    setCreating(true);
    const res = await fetch("/api/elections/create", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, electionType, startDate, endDate, requireReputation: requireRep, allowDelegation, snapshotEligibility: snapshot, candidates }) });
    if (res.ok) { setShowCreate(false); setTitle(""); setStartDate(""); setEndDate(""); setCandidates([{ name: "", department: "" }, { name: "", department: "" }]); loadElections(); }
    else { const d = await res.json(); setError(d.error || "Failed to create"); }
    setCreating(false);
  }

  if (loading || !user) return null;
  return (
    <DashboardLayout role="COUNCIL">
      <div className="flex justify-between items-center mb-5">
        <div><h2 className="text-xl heading">Election Setup</h2><p className="text-xs text-gray-400">{elections.length} elections</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">{showCreate ? "Cancel" : "+ Create election"}</button>
      </div>
      {showCreate && (
        <div className="card p-5 mb-5 border-[1.5px] border-samsung-primary">
          <h3 className="text-sm heading mb-3">New Election</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Council Election — Q3 2025" className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
              <select value={electionType} onChange={e => setElectionType(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none bg-white">
                <option value="SINGLE_CHOICE">Single choice</option><option value="MULTI_CHOICE">Multi choice</option><option value="RANKED">Ranked</option></select></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Start</label>
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">End</label>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none" /></div>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={requireRep} onChange={e => setRequireRep(e.target.checked)} className="accent-samsung-primary" /><span className="text-gray-600">Require reputation</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={allowDelegation} onChange={e => setAllowDelegation(e.target.checked)} className="accent-samsung-primary" /><span className="text-gray-600">Allow delegation</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={snapshot} onChange={e => setSnapshot(e.target.checked)} className="accent-samsung-primary" /><span className="text-gray-600">Snapshot eligibility</span></label>
          </div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">Candidates (min 2)</h4>
          {candidates.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={c.name} onChange={e => updateCandidate(i, "name", e.target.value)} placeholder="Name" className="flex-1 px-3 py-2 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
              <input value={c.department} onChange={e => updateCandidate(i, "department", e.target.value)} placeholder="Department" className="flex-1 px-3 py-2 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
              {candidates.length > 2 && <button onClick={() => removeCandidate(i)} className="p-2 text-gray-400 hover:text-danger"><Trash2 className="w-4 h-4" /></button>}
            </div>))}
          <button onClick={addCandidate} className="text-xs text-samsung-primary font-medium flex items-center gap-1 mb-4"><Plus className="w-3 h-3" /> Add candidate</button>
          {error && <div className="bg-danger-light text-danger text-xs rounded-lg px-3 py-2 mb-3">{error}</div>}
          <button onClick={handleCreate} disabled={creating} className="btn-primary text-sm w-full">{creating ? "Creating..." : "Create election"}</button>
        </div>)}
      {elections.map(el => (
        <div key={el.id} className="card p-4 mb-3"><div className="flex flex-col sm:flex-row justify-between items-start gap-3"><div>
          <div className="flex items-center gap-2 mb-1"><StatusBadge status={el.status.toLowerCase()} /><span className="text-sm font-semibold text-gray-900">{el.title}</span></div>
          <div className="text-[11px] text-gray-400">{new Date(el.startDate).toLocaleDateString()} — {new Date(el.endDate).toLocaleDateString()} · {el.candidates?.length || 0} candidates · {el.eligibleMemberCount} eligible</div>
        </div><span className="font-mono text-xs text-gray-400">{(el.electionType || "").replace(/_/g, " ").toLowerCase()}</span></div></div>))}
    </DashboardLayout>);
}
