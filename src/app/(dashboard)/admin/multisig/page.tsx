"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface MultisigAction {
  id: string;
  description: string;
  proposalNumber: number | null;
  requiredSigs: number;
  totalSigners: number;
  status: string;
  expiresAt: string;
  signatures: { user: { name: string; employeeId: string } }[];
}

interface CouncilMember {
  id: string;
  name: string;
  employeeId: string;
  hederaAccountId: string | null;
}

export default function MultisigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [actions, setActions] = useState<MultisigAction[]>([]);
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/multisig").then(r => r.json()).then(d => {
      setActions(d.actions || []);
      setCouncilMembers(d.councilMembers || []);
    }).catch(() => {});
  }, []);

  if (loading || !user) return null;

  return (
    <DashboardLayout role="ADMIN">
      <h2 className="text-xl heading mb-1">Multisig Council</h2>
      <p className="text-xs text-gray-400 mb-5">3-of-5 council signature requirement for governance actions</p>

      {/* Council Members */}
      <div className="card p-5 mb-5">
        <h3 className="text-sm heading mb-3">Council Members ({councilMembers.length})</h3>
        <div className="grid grid-cols-5 gap-3">
          {councilMembers.map(m => (
            <div key={m.id} className="text-center p-3 rounded-xl bg-gray-50 border-thin border-gray-200">
              <div className="w-10 h-10 rounded-full bg-samsung-light mx-auto mb-2 flex items-center justify-center text-sm font-bold text-samsung-primary">
                {m.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="text-xs font-medium text-gray-700">{m.name}</div>
              <div className="font-mono text-[10px] text-gray-400 mt-0.5">{m.employeeId}</div>
              <div className="font-mono text-[10px] text-samsung-primary mt-0.5">{m.hederaAccountId || "No wallet"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Actions */}
      <h3 className="text-sm heading mb-3">Pending Actions</h3>
      {actions.length === 0 ? (
        <div className="card text-center py-8"><p className="text-sm text-gray-400">No pending multisig actions.</p></div>
      ) : actions.map(action => {
        const signedIds = new Set(action.signatures.map(s => s.user.employeeId));
        const hoursLeft = Math.max(0, Math.round((new Date(action.expiresAt).getTime() - Date.now()) / 3600000));
        return (
          <div key={action.id} className="card p-5 mb-3">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">{action.description}</div>
                {action.proposalNumber && (
                  <span className="font-mono text-[11px] text-gray-400">Proposal P-{action.proposalNumber}</span>
                )}
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-semibold text-samsung-primary">{action.signatures.length}/{action.requiredSigs}</span>
                <span className="text-[11px] text-gray-400 block">{hoursLeft}h remaining</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-samsung-primary rounded-full transition-all"
                style={{ width: `${(action.signatures.length / action.requiredSigs) * 100}%` }} />
            </div>

            {/* Signers */}
            <div className="flex gap-2">
              {councilMembers.map(m => {
                const signed = signedIds.has(m.employeeId);
                return (
                  <div key={m.id} className={`flex-1 text-center py-2 px-1 rounded-lg border-thin ${
                    signed ? "bg-success-light border-success/20" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className={`w-7 h-7 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px] font-semibold ${
                      signed ? "bg-success/20 text-success" : "bg-gray-100 text-gray-400"
                    }`}>{m.name.split(" ").map(n => n[0]).join("")}</div>
                    <div className="text-[10px] text-gray-500">{m.name.split(" ")[0]}</div>
                    <div className={`text-[9px] font-mono mt-0.5 ${signed ? "text-success" : "text-gray-400"}`}>
                      {signed ? "Signed" : "Pending"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </DashboardLayout>
  );
}
