import { useEffect, useState } from 'react';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { memberApi } from '@/lib/memberApi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type CandidateRow = {
  id: string;
  name: string;
  department: string | null;
  voteCount: number;
  percentage: number;
};

type ActiveElection = {
  id: string;
  title: string;
  end_date: string;
  eligible_count: number;
  totalVotes: number;
  userVotedCandidateId: string | null;
  candidates: CandidateRow[];
};

export default function Vote() {
  const { dashboardData, isLoading, loadDashboard } = useMemberDashboardStore();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const election = dashboardData?.activeElection as ActiveElection | null | undefined;

  useEffect(() => {
    if (election?.userVotedCandidateId) {
      setSelectedCandidate(election.userVotedCandidateId);
    }
  }, [election?.userVotedCandidateId]);

  const handleCast = async () => {
    if (!election || !selectedCandidate) return;
    if (election.userVotedCandidateId) {
      toast.info('You already voted in this election');
      return;
    }
    setSubmitting(true);
    try {
      await memberApi.post('/vote', {
        electionId: election.id,
        candidateId: selectedCandidate,
      });
      toast.success('Vote recorded');
      await loadDashboard();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (e instanceof Error ? e.message : 'Vote failed');
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Voting Booth</h1>
        <p className="text-sm text-muted-foreground mt-1">Cast your vote in active elections</p>
      </div>

      {isLoading && !election ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !election || !election.candidates?.length ? (
        <div className="glass-card rounded-xl p-10 border border-border/50 bg-muted/10 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">There are currently no active elections.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden border border-primary/20 bg-background/50 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />

          <div className="p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                single choice
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground mb-2">{election.title}</h2>
            <p className="text-sm text-muted-foreground mb-8 border-b border-border/50 pb-6">
              Closes {new Date(election.end_date).toLocaleString()} · {election.eligible_count}{' '}
              eligible · {election.totalVotes} votes cast (
              {election.eligible_count > 0
                ? Math.round((election.totalVotes / election.eligible_count) * 1000) / 10
                : 0}
              % turnout)
            </p>

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-semibold mb-2">Select a candidate</h3>

              {election.candidates.map((c) => {
                const isSelected = selectedCandidate === c.id;
                const votedHere = election.userVotedCandidateId === c.id;
                const width = Math.min(100, Math.max(4, c.percentage));

                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!!election.userVotedCandidateId && !votedHere}
                    onClick={() => {
                      if (!election.userVotedCandidateId) setSelectedCandidate(c.id);
                    }}
                    className={`relative overflow-hidden flex items-center w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected || votedHere
                        ? 'border-primary ring-1 ring-primary/50 bg-primary/5'
                        : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-primary/10 transition-all duration-500 ease-out"
                      style={{ width: `${width}%` }}
                    />

                    <div className="relative flex items-center justify-between w-full z-10 gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase shrink-0 ${
                            isSelected || votedHere
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {c.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.department || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-bold text-foreground">
                          {c.voteCount} · {c.percentage}%
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected || votedHere ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}
                        >
                          {(isSelected || votedHere) && (
                            <div className="w-2.5 h-2.5 rounded-full bg-background" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-6 border-t border-border/50">
              <Button
                disabled={!selectedCandidate || !!election.userVotedCandidateId || submitting}
                onClick={handleCast}
                className="w-full sm:w-auto px-8 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 h-11"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting…
                  </>
                ) : election.userVotedCandidateId ? (
                  'Vote submitted'
                ) : (
                  'Cast vote'
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-3 text-center sm:text-left">
                One vote per election. Your choice is stored in the governance database.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
