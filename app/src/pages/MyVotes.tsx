import { Link } from 'react-router-dom';
import { useMyVotes, usePolls, useWallet, useWalletAddress } from '../hooks';
import { formatDate } from '../lib/polls';
import { explorerUrl } from '../client';

export function MyVotes() {
  const wallet = useWallet();
  const { data: votes, isLoading } = useMyVotes(useWalletAddress());
  const { data: polls } = usePolls();

  if (!wallet) return <p className="text-slate-400">Connect a wallet to see your voting history.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My votes</h1>
      {isLoading && <p className="text-slate-400">Loading your votes…</p>}
      {votes?.length === 0 && <p className="text-slate-400">This wallet has not voted yet.</p>}
      <div className="space-y-3">
        {votes?.map((vote) => {
          const poll = polls?.find((p) => p.address === vote.poll);
          return (
            <div key={vote.address} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link to={`/polls/${vote.poll}`} className="font-semibold hover:underline">
                  {poll?.title ?? 'Poll'}
                </Link>
                <p className="text-sm text-slate-400">
                  Voted <span className="text-slate-200">{poll?.options[vote.selectedOption] ?? `option ${vote.selectedOption + 1}`}</span> on{' '}
                  {formatDate(vote.votedAt)}
                </p>
              </div>
              <a className="link text-sm" href={explorerUrl('address', vote.address)} target="_blank" rel="noreferrer">
                Vote record ↗
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
