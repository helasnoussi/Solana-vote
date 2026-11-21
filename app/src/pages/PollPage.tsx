import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { address as toAddress, type Address, isAddress } from '@solana/kit';
import { getClosePollInstruction, getVoteInstructionAsync } from '../generated';
import { useMyVote, usePoll, useSendInstructions, useWallet, useWalletAddress } from '../hooks';
import { formatDate, percent, pollStatus, shortAddress } from '../lib/polls';
import { explorerUrl } from '../client';
import { ResultsChart } from '../components/ResultsChart';
import { StatusBadge } from '../components/StatusBadge';
import { TxStatus } from '../components/TxStatus';

export function PollPage() {
  const params = useParams();
  const pollAddress: Address | undefined = params.address && isAddress(params.address) ? toAddress(params.address) : undefined;
  const wallet = useWallet();
  const { data: poll, isLoading } = usePoll(pollAddress);
  const { data: myVote } = useMyVote(pollAddress, useWalletAddress());
  const { state, send } = useSendInstructions();
  const [choice, setChoice] = useState<number | null>(null);

  if (!pollAddress) return <p className="text-rose-400">Invalid poll address.</p>;
  if (isLoading) return <p className="text-slate-400">Loading poll…</p>;
  if (!poll) return <p className="text-rose-400">Poll not found on Devnet.</p>;

  const status = pollStatus(poll);
  const isAuthority = wallet?.account.address === poll.authority;
  const canVote = status === 'open' && wallet?.signer && myVote === null;

  async function vote() {
    if (!wallet?.signer || choice === null) return;
    // The VoteRecord PDA ["vote", poll, voter] is derived automatically by the generated client.
    const ix = await getVoteInstructionAsync({ voter: wallet.signer, poll: pollAddress!, optionIndex: choice });
    await send([ix]);
  }

  async function close() {
    if (!wallet?.signer) return;
    const ix = getClosePollInstruction({ authority: wallet.signer, poll: pollAddress! });
    await send([ix]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="space-y-5 lg:col-span-3">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{poll.title}</h1>
            <StatusBadge status={status} />
          </div>
          {poll.description && <p className="mt-2 text-slate-400">{poll.description}</p>}
          <p className="mt-3 text-sm text-slate-500">
            {status === 'open' ? 'Ends' : 'Ended'} {formatDate(poll.endTime)} · created by{' '}
            <a className="link font-mono" href={explorerUrl('address', poll.authority)} target="_blank" rel="noreferrer">
              {shortAddress(poll.authority)}
            </a>
          </p>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Options</h2>
          {poll.options.map((option, i) => {
            const voted = myVote?.selectedOption === i;
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 ${
                  choice === i ? 'border-violet-500 bg-violet-500/10' : voted ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700'
                } ${!canVote ? 'cursor-default' : ''}`}
              >
                <span className="flex items-center gap-3">
                  {canVote && <input type="radio" name="choice" checked={choice === i} onChange={() => setChoice(i)} className="accent-violet-500" />}
                  {option}
                  {voted && <span className="text-xs text-emerald-300">· your vote</span>}
                </span>
                <span className="text-sm text-slate-400">{percent(poll.voteCounts[i], poll.totalVotes)}%</span>
              </label>
            );
          })}

          {!wallet && status === 'open' && <p className="text-sm text-slate-400">Connect a wallet to vote.</p>}
          {myVote && <p className="text-sm text-emerald-300">You voted on {formatDate(myVote.votedAt)}. One vote per wallet.</p>}
          {status !== 'open' && <p className="text-sm text-slate-400">Voting is {status === 'closed' ? 'closed by the creator' : 'over'}.</p>}

          {canVote && (
            <button className="btn-primary w-full" disabled={choice === null || state.status === 'pending'} onClick={vote}>
              {state.status === 'pending' ? 'Voting…' : 'Submit my vote (≈ 0.001 SOL rent)'}
            </button>
          )}
          <TxStatus state={state} />
        </div>

        {isAuthority && poll.isActive && (
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Administration</h2>
              <p className="text-sm text-slate-400">You created this poll. Closing it stops voting immediately.</p>
            </div>
            <button className="btn-danger" disabled={state.status === 'pending'} onClick={close}>
              Close poll
            </button>
          </div>
        )}
      </section>

      <aside className="space-y-4 lg:col-span-2">
        <div className="card">
          <h2 className="mb-1 font-semibold">Results</h2>
          <p className="mb-4 text-sm text-slate-400">{poll.totalVotes.toString()} participants · read on-chain</p>
          <ResultsChart options={poll.options} counts={poll.voteCounts} total={poll.totalVotes} />
        </div>
        <div className="card space-y-2 text-sm">
          <h2 className="font-semibold">Verify on-chain</h2>
          <a className="link block font-mono" href={explorerUrl('address', pollAddress)} target="_blank" rel="noreferrer">
            Poll account {shortAddress(pollAddress)} ↗
          </a>
          <p className="text-slate-500">Poll id {poll.pollId.toString()}</p>
        </div>
      </aside>
    </div>
  );
}
