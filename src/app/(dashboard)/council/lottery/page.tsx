"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function LotteryConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState(""); const [prize, setPrize] = useState(""); const [desc, setDesc] = useState(""); const [drawDate, setDrawDate] = useState("");
  const [creating, setCreating] = useState(false); const [error, setError] = useState("");

  useEffect(() => { if (!loading && !user) router.push("/auth/login"); if (!loading && user && user.role !== "COUNCIL") router.push("/"); }, [loading, user, router]);
  useEffect(() => { loadEvents(); }, []);
  function loadEvents() { fetch("/api/events").then(r => r.json()).then((d: any[]) => setEvents(d.filter(e => e.type === "LOTTERY"))).catch(() => {}); }

  async function handleCreate() {
    setError("");
    if (!title || !prize) { setError("Title and prize are required."); return; }
    setCreating(true);
    const res = await fetch("/api/events/create", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "LOTTERY", title, description: desc, prize, drawDate: drawDate || undefined }) });
    if (res.ok) { setTitle(""); setPrize(""); setDesc(""); setDrawDate(""); loadEvents(); }
    else { const d = await res.json(); setError(d.error || "Failed to create"); }
    setCreating(false);
  }

  if (loading || !user) return null;
  return (
    <DashboardLayout role="COUNCIL">
      <h2 className="text-xl heading mb-1">Lottery Config</h2>
      <p className="text-xs text-gray-400 mb-5">Create and manage lottery events</p>
      <div className="card p-5 mb-5">
        <h3 className="text-sm heading mb-3">Create Lottery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q3 SPU Lottery" className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" /></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Prize</label>
            <input value={prize} onChange={e => setPrize(e.target.value)} placeholder="e.g. 500 SPU" className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary" /></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description" className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" /></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Draw date</label>
            <input type="datetime-local" value={drawDate} onChange={e => setDrawDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none" /></div>
        </div>
        {error && <div className="bg-danger-light text-danger text-xs rounded-lg px-3 py-2 mb-3">{error}</div>}
        <button onClick={handleCreate} disabled={creating || !title || !prize} className="btn-primary text-sm">{creating ? "Creating..." : "Create lottery"}</button>
      </div>
      <h3 className="text-sm heading mb-3">Lotteries ({events.length})</h3>
      {events.map(ev => (
        <div key={ev.id} className="card p-4 mb-2 flex justify-between items-center">
          <div><div className="text-sm font-medium text-gray-700">{ev.title}</div>
            <div className="text-[11px] text-gray-400">{ev.prize} · {ev._count?.entries || 0} entries{ev.drawDate ? ` · Draw: ${new Date(ev.drawDate).toLocaleDateString()}` : ""}</div></div>
          <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${ev.status === "ACTIVE" ? "bg-success-light text-success" : "bg-gray-100 text-gray-400"}`}>{ev.status?.toLowerCase()}</span>
        </div>))}
    </DashboardLayout>);
}
