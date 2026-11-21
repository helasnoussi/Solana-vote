import { createClient } from '@solana/kit';
import { solanaRpc } from '@solana/kit-plugin-rpc';
import { walletSigner } from '@solana/kit-plugin-wallet';

export const CLUSTER = 'devnet';
const RPC_URL = import.meta.env.VITE_RPC_URL ?? 'https://api.devnet.solana.com';

/**
 * One Kit client for the whole app.
 * - walletSigner: discovers Wallet Standard wallets (Phantom, Solflare, Backpack…)
 *   and makes the connected wallet the fee payer + signer.
 * - solanaRpc: RPC connection + transaction planning and sending.
 *   Version 0 transactions: our instructions are small, and every wallet signs v0.
 */
export const client = createClient()
  .use(walletSigner({ chain: 'solana:devnet' }))
  .use(solanaRpc({ rpcUrl: RPC_URL, transactionConfig: { version: 0 } }));

export type AppClient = typeof client;

export const explorerUrl = (kind: 'address' | 'tx', value: string) =>
  `https://explorer.solana.com/${kind}/${value}?cluster=${CLUSTER}`;
