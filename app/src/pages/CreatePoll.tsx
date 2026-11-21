import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findPollPda, getCreatePollInstructionAsync } from '../generated';
import { useSendInstructions, useWallet } from '../hooks';
import { TxStatus } from '../components/TxStatus';

// Same limits as the on-chain program (constants.rs). Lengths are in bytes.
const MAX_TITLE = 64;
const MAX_DESCRIPTION = 256;
const MAX_OPTION = 32;
const MAX_OPTIONS = 10;
const bytes = (s: string) => new TextEncoder().encode(s).length;

/** Default deadline: in 24 hours, formatted for <input type="datetime-local">. */
function defaultEnd() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function CreatePoll() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const { state, send } = useSendInstructions();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [end, setEnd] = useState(defaultEnd);

  const endTime = BigInt(Math.floor(new Date(end).getTime() / 1000));
  const problems = [
    !title.trim() && 'The title is required.',
    bytes(title) > MAX_TITLE && `The title is limited to ${MAX_TITLE} bytes.`,
    bytes(description) > MAX_DESCRIPTION && `The description is limited to ${MAX_DESCRIPTION} bytes.`,
    options.some((o) => !o.trim()) && 'Every option needs a text.',
    options.some((o) => bytes(o) > MAX_OPTION) && `Options are limited to ${MAX_OPTION} bytes.`,
    endTime * 1000n <= BigInt(Date.now()) && 'The end date must be in the future.',
  ].filter(Boolean) as string[];

  const setOption = (i: number, value: string) => setOptions(options.map((o, j) => (j === i ? value : o)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet?.signer || problems.length) return;
    const pollId = BigInt(Date.now()); // unique per creator, part of the PDA seeds
    const ix = await getCreatePollInstructionAsync({
      authority: wallet.signer,
      pollId,
      title: title.trim(),
      description: description.trim(),
      options: options.map((o) => o.trim()),
      endTime,
    });
    const signature = await send([ix]);
    if (signature) {
      const [poll] = await findPollPda({ authority: wallet.signer.address, pollId });
      setTimeout(() => navigate(`/polls/${poll}`), 1500);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Create a poll</h1>

      <label className="block">
        <span className="label">Title</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Which blockchain should the next workshop cover?" />
        <span className="hint">{bytes(title)}/{MAX_TITLE}</span>
      </label>

      <label className="block">
        <span className="label">Description (optional)</span>
        <textarea className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
        <span className="hint">{bytes(description)}/{MAX_DESCRIPTION}</span>
      </label>

      <div>
        <span className="label">Options ({options.length}/{MAX_OPTIONS})</span>
        <div className="space-y-2">
          {options.map((option, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" value={option} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
              {options.length > 2 && (
                <button type="button" className="btn-secondary" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < MAX_OPTIONS && (
          <button type="button" className="link mt-2 text-sm" onClick={() => setOptions([...options, ''])}>
            + Add an option
          </button>
        )}
      </div>

      <label className="block">
        <span className="label">Voting ends at</span>
        <input type="datetime-local" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
      </label>

      {problems.length > 0 && (title || options.some(Boolean)) && (
        <ul className="list-inside list-disc text-sm text-amber-300">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}

      <TxStatus state={state} />

      <button type="submit" className="btn-primary w-full" disabled={!wallet || problems.length > 0 || state.status === 'pending'}>
        {!wallet ? 'Connect a wallet to create a poll' : state.status === 'pending' ? 'Creating…' : 'Create poll (≈ 0.005 SOL rent)'}
      </button>
    </form>
  );
}
