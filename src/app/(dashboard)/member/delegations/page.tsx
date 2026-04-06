"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserPlus, X } from "lucide-react";

interface DelegateInfo {
  id: string; name: string; employeeId: string; department: string; reputationScore: number;
}

interface DelegationItem {
  id: string;
  delegate?: DelegateInfo;
  delegator?: DelegateInfo;
}

export default function DelegationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [given, setGiven] = useState<DelegationItem[]>([]);
  const [received, setReceived] = useState<DelegationItem[]>([]);
  const [available, setAvailable] = useState<DelegateInfo[]>([]);
  const [limit, setLimit] = useState(5);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!loading && !user) router.push("/auth/login"); }, [loading, user, router]);
  useEffect(() => { loadDelegations(); }, []);

  function loadDelegations() {
    fetch("/api/delegations").then(r => r.json()).then(d => {
      setGiven(d.given || []);
      setReceived(d.received || []);
      setAvailable(d.availableDelegates || []);
      setLimit(d.delegationLimit || 5);
    }).catch(() => {});
  }

  async function createDelegation(delegateId: string) {
    setError("");
    const res = await fetch("/api/delegations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delegateId }),
    });
    if (res.ok) { loadDelegations(); setShowAdd(false); }
    else { const d = await res.json(); setError(d.error || "Failed to delegate"); }
  }

  async function revokeDelegation(delegationId: string) {
    const res = await fetch("/api/delegations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delegationId }),
    });
    if (res.ok) loadDelegations();
    else { const d = await res.json(); alert(d.error || "Failed to revoke"); }
  }

  if (loading || !user) return null;
  const isDelegate = user.memberType === "DELEGATE";

  return (
    <DashboardLayout role="MEMBER">
      <h2 className="text-xl heading mb-1">My Delegations</h2>
      <p className="text-xs text-gray-400 mb-5">
        {isDelegate ? "Manage votes delegated to you" : "Delegate your voting power to trusted members"}
        {` · Limit: ${limit} per delegate`}
      </p>

      {/* Given delegations (Proposer view) */}
      {!isDelegate && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm heading">Delegated to ({given.length})</h3>
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-xs flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" /> {showAdd ? "Cancel" : "Delegate"}
            </button>
          </div>

          {showAdd && (
            <div className="card p-4 mb-3 border-[1.5px] border-samsung-primary">
              <h4 className="text-xs heading mb-2">Select a delegate</h4>
              {error && <div className="bg-danger-light text-danger text-xs rounded-lg px-3 py-2 mb-2">{error}</div>}
              {available.length === 0 ? (
                <p className="text-xs text-gray-400">No available delegates with bound wallets.</p>
              ) : available.map(d => (
                <div key={d.id} className="flex justify-between items-center py-2 border-b border-thin border-gray-200 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-samsung-light flex items-center justify-center text-xs font-bold text-samsung-primary">
                      {d.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-gray-700">{d.name}</div>
                      <div className="text-[11px] text-gray-400">{d.department} · {d.reputationScore} pts</div>
                    </div>
                  </div>
                  <button onClick={() => createDelegation(d.id)} className="text-xs text-samsung-primary font-semibold hover:underline">Delegate</button>
                </div>
              ))}
            </div>
          )}

          {given.length === 0 ? (
            <div className="card text-center py-6"><p className="text-xs text-gray-400">You haven't delegated your vote to anyone.</p></div>
          ) : given.map(g => (
            <div key={g.id} className="card p-4 mb-2 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-samsung-light flex items-center justify-center text-xs font-bold text-samsung-primary">
                  {g.delegate?.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-gray-700">{g.delegate?.name}</div>
                  <div className="text-[11px] text-gray-400">{g.delegate?.department} · {g.delegate?.employeeId}</div>
                </div>
              </div>
              <button onClick={() => revokeDelegation(g.id)} className="flex items-center gap-1 text-xs text-danger font-medium hover:underline">
                <X className="w-3.5 h-3.5" /> Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Received delegations (Delegate view) */}
      {isDelegate && (
        <div>
          <h3 className="text-sm heading mb-3">Received delegations ({received.length}/{limit})</h3>
          {received.length === 0 ? (
            <div className="card text-center py-6"><p className="text-xs text-gray-400">No one has delegated to you yet.</p></div>
          ) : received.map(r => (
            <div key={r.id} className="card p-4 mb-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-samsung-light flex items-center justify-center text-xs font-bold text-samsung-primary">
                {r.delegator?.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="text-[13px] font-medium text-gray-700">{r.delegator?.name}</div>
                <div className="text-[11px] text-gray-400">{r.delegator?.department} · {r.delegator?.reputationScore} pts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
