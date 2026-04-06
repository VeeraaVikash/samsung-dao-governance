"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Election {
  id: string;
  title: string;
  status: string;
  electionType: string;
  startDate: string;
  endDate: string;
  eligibleMemberCount: number;
  candidates: { id: string; name: string; department: string; voteCount: number }[];
  _count: { votes: number };
}

export default function VotePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/elections").then((r) => r.json()).then(setElections).catch(() => {});
  }, []);

  async function castVote(electionId: string) {
    if (!selectedCandidate) return;
    setVoting(true);

    const res = await fetch("/api/elections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ electionId, candidateId: selectedCandidate }),
    });

    if (res.ok) {
      setVoteSuccess(true);
      const updated = await fetch("/api/elections").then((r) => r.json());
      setElections(updated);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setVoting(false);
  }

  if (loading || !user) return null;

  const liveElections = elections.filter((e) => e.status === "LIVE");
  const pastElections = elections.filter((e) => e.status !== "LIVE" && e.status !== "DRAFT" && e.status !== "SCHEDULED");

  return (
    <DashboardLayout role="MEMBER">
      <h2 className="text-xl heading mb-1">Voting Booth</h2>
      <p className="text-xs text-gray-400 mb-5">Cast your vote in active elections</p>

      {liveElections.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-sm text-gray-400">No active elections right now.</p>
        </div>
      )}

      {liveElections.map((election) => {
        const totalVotes = election.candidates.reduce((a, c) => a + c.voteCount, 0);
        return (
          <div key={election.id} className="card p-5 mb-5 border-[1.5px] border-samsung-primary">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status="live" label="LIVE NOW" />
              <span className="font-mono text-[10px] text-gray-400">
                {election.electionType.replace("_", " ").toLowerCase()}
              </span>
            </div>
            <h3 className="text-lg heading mb-1">{election.title}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Closes: {new Date(election.endDate).toLocaleString()} ·{" "}
              {election.eligibleMemberCount} eligible · {totalVotes} votes cast (
              {((totalVotes / election.eligibleMemberCount) * 100).toFixed(1)}%)
            </p>

            {voteSuccess ? (
              <div className="bg-success-light rounded-xl p-4 text-center">
                <div className="text-success font-semibold text-sm mb-1">Vote cast successfully</div>
                <div className="text-xs text-gray-500">Your vote has been recorded on Hedera testnet.</div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-4">
                  {election.candidates.map((c) => {
                    const pct = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : "0";
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCandidate(c.id)}
                        className={`relative overflow-hidden flex items-center justify-between px-4 py-3 rounded-lg border-thin cursor-pointer transition-all ${
                          selectedCandidate === c.id
                            ? "bg-samsung-light border-samsung-primary"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* Vote bar background */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-samsung-primary/5 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-9 h-9 rounded-full bg-samsung-light flex items-center justify-center text-xs font-bold text-samsung-primary">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">{c.name}</div>
                            <div className="text-[11px] text-gray-400">{c.department}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="text-right">
                            <div className="font-mono text-xs font-semibold text-gray-700">{c.voteCount}</div>
                            <div className="font-mono text-[10px] text-gray-400">{pct}%</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
                            selectedCandidate === c.id
                              ? "border-samsung-primary bg-samsung-primary"
                              : "border-gray-300"
                          }`}>
                            {selectedCandidate === c.id && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => castVote(election.id)}
                  disabled={!selectedCandidate || voting}
                  className="btn-primary w-full"
                >
                  {voting ? "Casting vote on-chain…" : "Cast vote"}
                </button>
              </>
            )}
          </div>
        );
      })}

      {pastElections.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm heading mb-3">Past Elections</h3>
          {pastElections.map((e) => (
            <div key={e.id} className="card mb-2 flex justify-between items-center">
              <div>
                <div className="text-[13px] font-medium text-gray-700">{e.title}</div>
                <div className="text-[11px] text-gray-400">
                  {new Date(e.startDate).toLocaleDateString()} — {new Date(e.endDate).toLocaleDateString()}
                </div>
              </div>
              <StatusBadge status={e.status.toLowerCase()} />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
