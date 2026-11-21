import { useState } from 'react';
import {
  useConnect,
  useDisconnect,
  useWallets,
  WalletReadyGate,
} from '@solana/kit-plugin-wallet/react';
import { client } from '../client';
import { useWallet } from '../hooks';
import { shortAddress } from '../lib/polls';

function WalletMenu() {
  const wallets = useWallets(client);
  const connected = useWallet();
  const { dispatch: connect, isRunning: connecting, error } = useConnect(client);
  const { dispatch: disconnect } = useDisconnect(client);
  const [open, setOpen] = useState(false);

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm sm:inline">
          {shortAddress(connected.account.address)}
        </span>
        <button className="btn-secondary" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button className="btn-primary" disabled={connecting} onClick={() => setOpen(!open)}>
        {connecting ? 'Connecting…' : 'Connect wallet'}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
          {wallets.length === 0 ? (
            <p className="p-3 text-sm text-slate-400">
              No Solana wallet found. Install{' '}
              <a className="link" href="https://phantom.com" target="_blank" rel="noreferrer">
                Phantom
              </a>{' '}
              and switch it to Devnet.
            </p>
          ) : (
            wallets.map((wallet) => (
              <button
                key={wallet.name}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-800"
                onClick={() => {
                  setOpen(false);
                  connect(wallet);
                }}
              >
                <img src={wallet.icon} alt="" className="h-6 w-6" />
                {wallet.name}
              </button>
            ))
          )}
          {error != null && <p className="p-2 text-xs text-rose-400">Connection failed.</p>}
        </div>
      )}
    </div>
  );
}

export function WalletButton() {
  return (
    <WalletReadyGate client={client} fallback={<span className="text-sm text-slate-400">Loading wallets…</span>}>
      <WalletMenu />
    </WalletReadyGate>
  );
}
