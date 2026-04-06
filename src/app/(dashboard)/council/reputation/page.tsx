"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const reputationConfig = [
  { category: "Participation", action: "Cast a vote in election", points: "+15 pts", type: "earn" },
  { category: "Participation", action: "Enter a lottery or giveaway", points: "+5 pts", type: "earn" },
  { category: "Proposals", action: "Submit a proposal", points: "+20 pts", type: "earn" },
  { category: "Proposals", action: "Proposal approved", points: "+50 pts", type: "earn" },
  { category: "Proposals", action: "Proposal rejected", points: "-10 pts", type: "penalty" },
  { category: "Delegation", action: "Receive delegated votes", points: "+10 pts per delegation", type: "earn" },
  { category: "Tenure", action: "Monthly active member bonus", points: "+10 pts", type: "earn" },
  { category: "Decay", action: "Monthly inactivity penalty", points: "-5 pts", type: "penalty" },
  { category: "Decay", action: "Max decay floor", points: "0 pts (minimum)", type: "info" },
];

export default function ReputationRulesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [minRep, setMinRep] = useState(100);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "COUNCIL") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/governance").then(r => r.json()).then(d => {
      if (d?.minReputationScore) setMinRep(d.minReputationScore);
    }).catch(() => {});
  }, []);

  if (loading || !user) return null;

  return (
    <DashboardLayout role="COUNCIL">
      <h2 className="text-xl heading mb-1">Reputation Rules</h2>
      <p className="text-xs text-gray-400 mb-5">Configure how reputation points are earned, spent, and decayed</p>

      <div className="card p-4 mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-700">Minimum reputation to vote</div>
          <div className="text-xs text-gray-400">Members below this threshold cannot participate in elections</div>
        </div>
        <span className="font-mono text-lg font-bold text-samsung-primary">{minRep} pts</span>
      </div>

      <div className="card">
        <div className="flex gap-2 px-4 py-2.5 bg-gray-50 border-b border-thin border-gray-200">
          <span className="eyebrow min-w-[100px]">Category</span>
          <span className="eyebrow flex-1">Action</span>
          <span className="eyebrow min-w-[120px] text-right">Points</span>
        </div>
        {reputationConfig.map((rule, i) => (
          <div key={i} className={`flex gap-2 px-4 py-3 items-center ${i < reputationConfig.length - 1 ? "border-b border-thin border-gray-200" : ""}`}>
            <span className="text-xs text-gray-400 min-w-[100px]">{rule.category}</span>
            <span className="text-[13px] text-gray-700 flex-1">{rule.action}</span>
            <span className={`font-mono text-xs font-semibold min-w-[120px] text-right ${
              rule.type === "earn" ? "text-success" : rule.type === "penalty" ? "text-danger" : "text-gray-400"
            }`}>{rule.points}</span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
