import { Link } from 'react-router-dom';
import { usePolls } from '../hooks';
import { pollStatus } from '../lib/polls';
import { PollCard } from '../components/PollCard';
import { explorerUrl } from '../client';
import { SOLANA_VOTE_PROGRAM_ADDRESS } from '../generated';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const { data: polls, error, isLoading } = usePolls();
  const open = polls?.filter((p) => pollStatus(p) === 'open').length ?? 0;
  const votes = polls?.reduce((sum, p) => sum + p.totalVotes, 0n) ?? 0n;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Transparent voting on Solana</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Create polls, vote once per wallet, and read results straight from the blockchain — no central server.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/create" className="btn-primary">Create a poll</Link>
          <Link to="/polls" className="btn-secondary">Explore polls</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Polls created" value={isLoading ? '…' : polls?.length ?? 0} />
        <Stat label="Open polls" value={isLoading ? '…' : open} />
        <Stat label="Total votes" value={isLoading ? '…' : votes.toString()} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest polls</h2>
          <Link to="/polls" className="link text-sm">See all →</Link>
        </div>
        {error && <p className="text-rose-400">Could not load polls from Devnet.</p>}
        {polls?.length === 0 && <p className="text-slate-400">No poll yet. Be the first to create one!</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {polls?.slice(0, 4).map((poll) => <PollCard key={poll.address} poll={poll} />)}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Program{' '}
        <a className="link font-mono" href={explorerUrl('address', SOLANA_VOTE_PROGRAM_ADDRESS)} target="_blank" rel="noreferrer">
          {SOLANA_VOTE_PROGRAM_ADDRESS}
        </a>
      </p>
    </div>
  );
}
