import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { memberApi } from '@/lib/memberApi';
import { proposalStatusUi } from '@/lib/proposalStatusUi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type ProposalRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  creator?: { name: string; email?: string };
};

export default function Proposals() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await memberApi.get<{ proposals: ProposalRow[] }>('/proposals');
      setProposals(data.proposals);
    } catch {
      toast.error('Could not load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      await memberApi.post('/proposals', { title: title.trim(), description: description.trim() });
      toast.success('Proposal created');
      setOpen(false);
      setTitle('');
      setDescription('');
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Create failed';
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">{proposals.length} total proposals</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-[#1C208F] hover:bg-[#1C208F]/90 text-white font-semibold shadow-sm h-10 px-5"
        >
          <Plus className="h-4 w-4 mr-2" /> Create proposal
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleCreate}>
              {saving ? 'Saving…' : 'Create draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="glass-card rounded-xl p-0 border border-border/50 bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : proposals.length > 0 ? (
          <div className="divide-y divide-border/50">
            {proposals.map((p, i) => {
              const ui = proposalStatusUi(p.status);
              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-2 sm:mb-0 min-w-0">
                    <span className="text-sm font-mono text-muted-foreground font-medium pt-0.5 shrink-0">
                      P-{proposals.length - i}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.creator?.name ?? 'Member'} · {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border shrink-0 ${ui.className}`}
                  >
                    {ui.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No proposals yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
