import { explorerUrl } from '../client';
import type { TxState } from '../hooks';

/** Shows the progress of a transaction: pending, success (with Explorer link) or error. */
export function TxStatus({ state }: { state: TxState }) {
  if (state.status === 'idle') return null;
  if (state.status === 'pending') {
    return (
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-sm text-violet-200">
        ⏳ Waiting for wallet signature and confirmation…
      </div>
    );
  }
  if (state.status === 'success') {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
        ✅ Transaction confirmed.{' '}
        <a className="link" href={explorerUrl('tx', state.signature)} target="_blank" rel="noreferrer">
          View on Solana Explorer ↗
        </a>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
      ❌ {state.message}
    </div>
  );
}
