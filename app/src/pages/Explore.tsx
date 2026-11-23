import { useState } from 'react';
import { useNow, usePolls } from '../hooks';
import { pollStatus, type PollStatus } from '../lib/polls';
import { PollCard } from '../components/PollCard';

const FILTERS: { value: PollStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'ended', label: 'Ended' },
  { value: 'closed', label: 'Closed' },
];

export function Explore() {
  const { data: polls, error, isLoading } = usePolls();
  const [filter, setFilter] = useState<PollStatus | 'all'>('all');
  const now = useNow();
  const visible = polls?.filter((p) => filter === 'all' || pollStatus(p, now) === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Explore polls</h1>
        <div className="flex gap-1 rounded-lg bg-slate-900 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-sm ${filter === f.value ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading && <p className="text-slate-400">Loading polls from Devnet…</p>}
      {error && <p className="text-rose-400">Could not load polls from Devnet.</p>}
      {visible?.length === 0 && <p className="text-slate-400">No poll in this category.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {visible?.map((poll) => <PollCard key={poll.address} poll={poll} />)}
      </div>
    </div>
  );
}
