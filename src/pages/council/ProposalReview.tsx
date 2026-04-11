import { useState } from 'react';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/council/StatusBadge';
import { Button } from '@/components/ui/button';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { approveProposal, rejectProposal } from '@/services/councilService';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProposalReview() {
  const proposals = useCouncilGovStore((s) => s.proposals);
  const updateLocal = useCouncilGovStore((s) => s.updateProposalLocal);
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedProposal = proposals.find((p) => p.id === selected);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      if (action === 'approve') {
        await approveProposal(token, id);
        updateLocal(id, 'APPROVED');
        toast.success('Proposal approved');
      } else {
        await rejectProposal(token, id);
        updateLocal(id, 'REJECTED');
        toast.success('Proposal rejected');
      }
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-primary">Proposal Review</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve submitted proposals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-3 space-y-2">
          {proposals.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(p.id)}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                selected === p.id
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">P-{proposals.length - i}</span>
                  <span className="text-sm font-semibold text-foreground">{p.title}</span>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {p.creator?.name ?? 'Unknown'} · {format(new Date(p.created_at), 'M/d/yyyy')}
              </p>
            </motion.div>
          ))}
          {proposals.length === 0 && (
            <p className="py-12 text-center text-muted-foreground text-sm">No proposals</p>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selectedProposal ? (
            <motion.div
              key={selectedProposal.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl border border-border bg-card p-6 sticky top-24"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono text-muted-foreground">
                  P-{proposals.findIndex((p) => p.id === selectedProposal.id) + 1}
                </span>
                <StatusBadge status={selectedProposal.status} />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground mb-2">{selectedProposal.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{selectedProposal.description}</p>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Author</span>
                  <span className="font-medium">{selectedProposal.creator?.name ?? 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium">{format(new Date(selectedProposal.created_at), 'M/d/yyyy, h:mm:ss a')}</span>
                </div>
              </div>
              {!['APPROVED', 'REJECTED', 'PASSED', 'FAILED', 'EXECUTED'].includes(selectedProposal.status) && (
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => handleAction(selectedProposal.id, 'approve')} disabled={loading}>
                    Approve
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => handleAction(selectedProposal.id, 'reject')} disabled={loading}>
                    Reject
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Select a proposal to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
