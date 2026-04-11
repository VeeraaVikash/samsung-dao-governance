import { cn } from '@/lib/utils';

type StatusVariant = 'Draft' | 'Approved' | 'Review' | 'Pending' | 'Live' | 'Closed' | 'Enforced' | string;

const colorMap: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  DRAFT: 'bg-muted text-muted-foreground',
  Approved: 'bg-samsung-green/15 text-samsung-green',
  APPROVED: 'bg-samsung-green/15 text-samsung-green',
  PASSED: 'bg-samsung-green/15 text-samsung-green',
  Review: 'bg-samsung-orange/15 text-samsung-orange',
  REVIEW: 'bg-samsung-orange/15 text-samsung-orange',
  Pending: 'bg-samsung-orange/15 text-samsung-orange',
  SIGNALING: 'bg-samsung-orange/15 text-samsung-orange',
  Live: 'bg-destructive/15 text-destructive',
  LIVE: 'bg-destructive/15 text-destructive',
  Closed: 'bg-muted text-muted-foreground',
  CLOSED: 'bg-muted text-muted-foreground',
  Enforced: 'bg-samsung-green/15 text-samsung-green',
  REJECTED: 'bg-destructive/15 text-destructive',
  FAILED: 'bg-destructive/15 text-destructive',
};

export function StatusBadge({ status, className }: { status: StatusVariant; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium',
      colorMap[status] ?? 'bg-muted text-muted-foreground',
      className,
    )}>
      {status}
    </span>
  );
}
