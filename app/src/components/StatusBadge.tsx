import type { PollStatus } from '../lib/polls';

const STYLES: Record<PollStatus, string> = {
  open: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  ended: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  closed: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
};

const LABELS: Record<PollStatus, string> = { open: 'Open', ended: 'Ended', closed: 'Closed' };

export function StatusBadge({ status }: { status: PollStatus }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
