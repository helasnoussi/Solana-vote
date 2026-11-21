import { Link } from 'react-router-dom';
import { formatDate, pollStatus, type PollWithAddress } from '../lib/polls';
import { StatusBadge } from './StatusBadge';

export function PollCard({ poll }: { poll: PollWithAddress }) {
  const status = pollStatus(poll);
  return (
    <Link
      to={`/polls/${poll.address}`}
      className="card block transition hover:border-violet-500/60 hover:bg-slate-900"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{poll.title}</h3>
        <StatusBadge status={status} />
      </div>
      {poll.description && <p className="mb-4 line-clamp-2 text-sm text-slate-400">{poll.description}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>{poll.options.length} options</span>
        <span>{poll.totalVotes.toString()} votes</span>
        <span>{status === 'open' ? 'Ends' : 'Ended'} {formatDate(poll.endTime)}</span>
      </div>
    </Link>
  );
}
