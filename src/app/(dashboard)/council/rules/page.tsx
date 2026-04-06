"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Pencil, Save, X } from "lucide-react";

interface Rule {
  key: string;
  label: string;
  value: number;
  unit: string;
  field: string;
  min: number;
  max: number;
}

export default function RuleBuilderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rules, setRules] = useState<any>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "COUNCIL") router.push("/");
  }, [loading, user, router]);

  useEffect(() => { loadRules(); }, []);

  function loadRules() {
    fetch("/api/governance").then(r => r.json()).then(setRules).catch(() => {});
  }

  async function saveRule(field: string) {
    setSaving(true);
    await fetch("/api/governance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: editValue }),
    });
    loadRules();
    setEditing(null);
    setSaving(false);
  }

  if (!user || !rules) return null;

  const rulesList: Rule[] = [
    { key: "quorum", label: "Quorum threshold", value: rules.quorumThreshold, unit: "%", field: "quorumThreshold", min: 1, max: 100 },
    { key: "voting", label: "Voting window", value: rules.votingWindowHours, unit: "hours", field: "votingWindowHours", min: 1, max: 720 },
    { key: "rep", label: "Min. reputation score", value: rules.minReputationScore, unit: "pts", field: "minReputationScore", min: 0, max: 10000 },
    { key: "delegation", label: "Delegation limit", value: rules.delegationLimit, unit: "members", field: "delegationLimit", min: 1, max: 50 },
    { key: "delay", label: "Execution delay", value: rules.executionDelayHours, unit: "hours", field: "executionDelayHours", min: 0, max: 168 },
  ];

  return (
    <DashboardLayout role="COUNCIL">
      <h2 className="text-xl heading mb-1">Rule Builder</h2>
      <p className="text-xs text-gray-400 mb-5">Edit governance parameters for period #{rules.period}</p>

      <div className="card">
        {rulesList.map((rule, i) => (
          <div key={rule.key} className={`flex justify-between items-center py-4 px-4 ${i < rulesList.length - 1 ? "border-b border-thin border-gray-200" : ""}`}>
            <div>
              <div className="text-[13px] font-medium text-gray-700">{rule.label}</div>
              <div className="text-[11px] text-gray-400">Range: {rule.min}–{rule.max} {rule.unit}</div>
            </div>
            {editing === rule.key ? (
              <div className="flex items-center gap-2">
                <input type="number" value={editValue} onChange={e => setEditValue(Number(e.target.value))}
                  min={rule.min} max={rule.max}
                  className="w-20 px-2 py-1.5 rounded-lg border-thin border-samsung-primary text-[13px] font-mono text-gray-700 outline-none text-right" />
                <span className="text-xs text-gray-400">{rule.unit}</span>
                <button onClick={() => saveRule(rule.field)} disabled={saving}
                  className="p-1.5 rounded-lg bg-samsung-primary text-white hover:bg-samsung-dark"><Save className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditing(null)}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-gray-900">{rule.value} {rule.unit}</span>
                <button onClick={() => { setEditing(rule.key); setEditValue(rule.value); }}
                  className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 card p-4 bg-samsung-light/50">
        <div className="flex items-center gap-2 text-xs text-samsung-dark">
          <span className="font-mono font-semibold">Note:</span>
          <span>Rule changes require multisig approval (3-of-5) and a 48h timelock before taking effect.</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
