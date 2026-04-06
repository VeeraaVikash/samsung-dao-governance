"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function CouncilDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<any[]>([]);
  const [rules, setRules] = useState<any>(null);
  const [configTab, setConfigTab] = useState("election");
  const [saved, setSaved] = useState(true);
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Election config
  const [electionName, setElectionName] = useState("Council Election — Q2 2025");
  const [electionType, setElectionType] = useState("single");
  const [startDate, setStartDate] = useState("2025-04-01T09:00");
  const [endDate, setEndDate] = useState("2025-04-04T18:00");
  const [requireRep, setRequireRep] = useState(true);
  const [allowDelegation, setAllowDelegation] = useState(true);
  const [snapshotEnabled, setSnapshotEnabled] = useState(false);

  // Voting config
  const [votingWindow, setVotingWindow] = useState(72);
  const [minRep, setMinRep] = useState(100);

  // Giveaway config
  const [giveawayTitle, setGiveawayTitle] = useState("PRISM Research Giveaway");
  const [giveawayPrize, setGiveawayPrize] = useState("Samsung Galaxy Tab S9");
  const [giveawayClose, setGiveawayClose] = useState("2025-04-20T18:00");

  // Lottery config
  const [lotteryTitle, setLotteryTitle] = useState("Q2 Samsung SPU Lottery");
  const [lotteryPrize, setLotteryPrize] = useState("500 SPU");
  const [lotteryDraw, setLotteryDraw] = useState("2025-04-15T12:00");

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "COUNCIL") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/proposals").then(r => r.json()).then(setProposals).catch(() => {});
    fetch("/api/governance").then(r => r.json()).then(d => {
      if (d) {
        setRules(d);
        setVotingWindow(d.votingWindowHours);
        setMinRep(d.minReputationScore);
      }
    }).catch(() => {});
  }, []);

  function markUnsaved() { setSaved(false); setSaveMsg(""); }

  async function handleSave() {
    await fetch("/api/governance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votingWindowHours: votingWindow, minReputationScore: minRep }),
    });
    setSaved(true);
    setSaveMsg("Saved successfully");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  function handleDiscard() {
    if (rules) {
      setVotingWindow(rules.votingWindowHours);
      setMinRep(rules.minReputationScore);
    }
    setElectionName("Council Election — Q2 2025");
    setSaved(true);
    setSaveMsg("Changes discarded");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  if (loading || !user) return null;

  const rulesList = rules ? [
    ["Quorum threshold", `${rules.quorumThreshold}%`],
    ["Voting window", `${rules.votingWindowHours} hours`],
    ["Min. reputation", `${rules.minReputationScore} pts`],
    ["Delegation limit", `${rules.delegationLimit} members`],
    ["Execution delay", `${rules.executionDelayHours} hours`],
  ] : [
    ["Quorum threshold", "51%"], ["Voting window", "72 hours"],
    ["Min. reputation", "100 pts"], ["Delegation limit", "5 members"], ["Execution delay", "48 hours"],
  ];

  return (
    <DashboardLayout role="COUNCIL">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl heading">Council dashboard</h2>
          <span className="text-xs text-gray-400">Governance period #{rules?.period || 7} · Active since 12 Mar 2025</span>
        </div>
        <button onClick={() => setShowNewRule(true)} className="btn-primary text-sm">+ New rule</button>
      </div>

      {/* New Rule Modal */}
      {showNewRule && (
        <div className="card p-5 mb-5 border-[1.5px] border-samsung-primary">
          <h3 className="text-sm heading mb-3">Add New Governance Rule</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Rule name</label>
              <input value={newRuleName} onChange={e => setNewRuleName(e.target.value)}
                placeholder="e.g. Max proposal length"
                className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Value</label>
              <input value={newRuleValue} onChange={e => setNewRuleValue(e.target.value)}
                placeholder="e.g. 5000 characters"
                className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowNewRule(false); setNewRuleName(""); setNewRuleValue(""); }} className="btn-secondary text-sm">Cancel</button>
            <button onClick={() => { alert(`Rule "${newRuleName}" would be saved to smart contract. (Mock for MVP)`); setShowNewRule(false); setNewRuleName(""); setNewRuleValue(""); }}
              className="btn-primary text-sm" disabled={!newRuleName || !newRuleValue}>Save rule</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Active rules" value={rulesList.length + 7} delta="+2 this period" />
        <StatCard label="Pending proposals" value={proposals.filter(p => p.status === "PENDING").length} delta="Needs review" />
        <StatCard label="Eligible members" value="847" delta="Snapshot taken" />
        <StatCard label="Timelock" value="48h" delta="Mandatory" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h4 className="text-sm heading mb-3">Active Governance Rules</h4>
          {rulesList.map(([k, v], i) => (
            <div key={i} className="flex justify-between py-2 border-b border-thin border-gray-200 last:border-b-0">
              <span className="text-[13px] text-gray-500">{k}</span>
              <span className="font-mono text-xs text-gray-700 font-medium">{v}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h4 className="text-sm heading mb-3">Proposal Review Queue</h4>
          {proposals.map(p => (
            <div key={p.id} className="flex justify-between items-center py-2 border-b border-thin border-gray-200 last:border-b-0">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-gray-400">P-{p.number}</span>
                  <span className="text-[13px] text-gray-700">{p.title}</span>
                </div>
                <span className="text-[11px] text-gray-400">{p.author?.name}</span>
              </div>
              <StatusBadge status={p.status.toLowerCase()} label={p.status === "PENDING" ? "Review" : p.status.toLowerCase()} />
            </div>
          ))}
        </div>
      </div>

      {/* Config Tabs */}
      <div className="card mb-5">
        <div className="flex gap-0 border-b border-thin border-gray-200 mb-4">
          {["election", "voting", "giveaway", "lottery"].map(t => (
            <button key={t} onClick={() => setConfigTab(t)}
              className={`px-4 py-2 text-[13px] font-medium capitalize border-b-2 transition-colors ${
                configTab === t ? "text-samsung-primary border-samsung-primary" : "text-gray-400 border-transparent hover:text-gray-500"
              }`}>{t}</button>
          ))}
        </div>

        {/* Election Tab */}
        {configTab === "election" && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Election name</label>
                <input value={electionName} onChange={e => { setElectionName(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Election type</label>
                <select value={electionType} onChange={e => { setElectionType(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none bg-white">
                  <option value="single">Single choice</option><option value="multi">Multi choice</option><option value="ranked">Ranked</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Start date</label>
                <input type="datetime-local" value={startDate} onChange={e => { setStartDate(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">End date</label>
                <input type="datetime-local" value={endDate} onChange={e => { setEndDate(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none" />
              </div>
            </div>
            <ToggleRow label="Require reputation threshold" desc="Members below 100 pts cannot vote" checked={requireRep} onChange={v => { setRequireRep(v); markUnsaved(); }} />
            <ToggleRow label="Allow vote delegation" desc="Members can assign votes to delegates" checked={allowDelegation} onChange={v => { setAllowDelegation(v); markUnsaved(); }} />
            <ToggleRow label="Snapshot voter eligibility" desc="Lock eligible list at block height" checked={snapshotEnabled} onChange={v => { setSnapshotEnabled(v); markUnsaved(); }} />
          </div>
        )}

        {/* Voting Tab */}
        {configTab === "voting" && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Voting window (hours)</label>
                <input type="number" value={votingWindow} onChange={e => { setVotingWindow(Number(e.target.value)); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Min. reputation to vote</label>
                <input type="number" value={minRep} onChange={e => { setMinRep(Number(e.target.value)); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary" />
              </div>
            </div>
            <ToggleRow label="Require wallet binding" desc="Only members with bound wallets can vote" checked={true} onChange={() => markUnsaved()} />
            <ToggleRow label="Anonymous voting" desc="Hide voter identity until results are final" checked={false} onChange={() => markUnsaved()} />
          </div>
        )}

        {/* Giveaway Tab */}
        {configTab === "giveaway" && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Giveaway title</label>
                <input value={giveawayTitle} onChange={e => { setGiveawayTitle(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Prize</label>
                <input value={giveawayPrize} onChange={e => { setGiveawayPrize(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Closes at</label>
                <input type="datetime-local" value={giveawayClose} onChange={e => { setGiveawayClose(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none" />
              </div>
            </div>
            <ToggleRow label="Require KYC verification" desc="Only KYC-verified members can enter" checked={true} onChange={() => markUnsaved()} />
            <ToggleRow label="Allow multiple entries" desc="Members can register more than once" checked={false} onChange={() => markUnsaved()} />
          </div>
        )}

        {/* Lottery Tab */}
        {configTab === "lottery" && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Lottery title</label>
                <input value={lotteryTitle} onChange={e => { setLotteryTitle(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Prize</label>
                <input value={lotteryPrize} onChange={e => { setLotteryPrize(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Draw date</label>
                <input type="datetime-local" value={lotteryDraw} onChange={e => { setLotteryDraw(e.target.value); markUnsaved(); }}
                  className="w-full px-3 py-2.5 rounded-lg border-thin border-gray-300 text-[13px] font-mono text-gray-700 outline-none" />
              </div>
            </div>
            <ToggleRow label="Require minimum reputation" desc="Only members above 100 pts can enter" checked={true} onChange={() => markUnsaved()} />
            <ToggleRow label="On-chain random selection" desc="Use Hedera VRF for winner selection" checked={true} onChange={() => markUnsaved()} />
          </div>
        )}
      </div>

      {/* Save Bar */}
      <div className="sticky bottom-0 bg-white border-t border-thin border-gray-200 px-5 py-3 flex justify-between items-center rounded-b-xl">
        <span className="text-xs text-gray-400">
          {saveMsg ? <span className="text-success font-medium">{saveMsg}</span>
           : saved ? "All changes saved" : "Unsaved changes in config"}
        </span>
        <div className="flex gap-2">
          <button onClick={handleDiscard} className="btn-secondary text-sm" disabled={saved}>Discard</button>
          <button onClick={handleSave} className="btn-primary text-sm" disabled={saved}>Save & publish</button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-thin border-gray-200">
      <div>
        <div className="text-[13px] font-medium text-gray-700">{label}</div>
        <div className="text-[11px] text-gray-400">{desc}</div>
      </div>
      <button onClick={() => onChange(!checked)} className={`w-9 h-5 rounded-full relative transition-colors ${checked ? "bg-samsung-primary" : "bg-gray-200"}`}>
        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
