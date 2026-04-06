import { StatusBadge } from "./StatusBadge";

interface ProposalRowProps {
  number: number;
  title: string;
  status: string;
  author?: string;
  daysAgo?: string;
  showAuthor?: boolean;
}

export function ProposalRow({ number, title, status, author, daysAgo, showAuthor }: ProposalRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-thin border-gray-200 last:border-b-0">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-gray-400 font-medium">P-{number}</span>
          <span className="text-[13px] text-gray-700">{title}</span>
        </div>
        {showAuthor && author && (
          <span className="text-[11px] text-gray-400">{author}{daysAgo ? ` · ${daysAgo}` : ""}</span>
        )}
      </div>
      <StatusBadge status={status} />
    </div>
  );
}
