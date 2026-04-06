"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Pencil, Save, X } from "lucide-react";

export default function DelegationLimitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rules, setRules] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [newLimit, setNewLimit] = useState(5);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "COUNCIL") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/governance").then(r => r.json()).then(d => {
      setRules(d);
      if (d?.delegationLimit) setNewLimit(d.delegationLimit);
    }).catch(() => {});
  }, []);

  async function saveLimit() {
    await fetch("/api/governance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delegationLimit: newLimit }),
    });
    const updated = await fetch("/api/governance").then(r => r.json());
    setRules(updated);
    setEditing(false);
  }

  if (loading || !user) return null;

  const limit = rules?.delegationLimit || 5;

  return (
    <DashboardLayout role="COUNCIL">
      <h2 className="text-xl heading mb-1">Delegation Limits</h2>
      <p className="text-xs text-gray-400 mb-5">Configure maximum delegation chain and vote weight rules</p>

      <div className="card p-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Max delegations per delegate</div>
            <div className="text-xs text-gray-400">Maximum number of members who can delegate to a single delegate</div>
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input type="number" value={newLimit} onChange={e => setNewLimit(Number(e.target.value))} min={1} max={50}
                className="w-16 px-2 py-1.5 rounded-lg border-thin border-samsung-primary text-[13px] font-mono text-gray-700 outline-none text-right" />
              <button onClick={saveLimit} className="p-1.5 rounded-lg bg-samsung-primary text-white"><Save className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setEditing(false); setNewLimit(limit); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-500"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-samsung-primary">{limit}</span>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100"><Pencil className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm heading mb-3">Delegation Rules</h3>
        {[
          { rule: "Delegates must have a bound Hedera wallet", status: "Enforced" },
          { rule: "Self-delegation is not allowed", status: "Enforced" },
          { rule: "Circular delegation chains are blocked", status: "Enforced" },
          { rule: "Delegation can be revoked at any time", status: "Enforced" },
          { rule: "Delegated votes count toward quorum", status: "Enforced" },
          { rule: "Delegation expires after governance period", status: "Configurable" },
        ].map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2.5 border-b border-thin border-gray-200 last:border-b-0">
            <span className="text-[13px] text-gray-700">{item.rule}</span>
            <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
              item.status === "Enforced" ? "bg-success-light text-success" : "bg-warning-light text-warning"
            }`}>{item.status}</span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
