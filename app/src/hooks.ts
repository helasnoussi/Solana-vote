import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { address, type Address, type Instruction } from '@solana/kit';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { client } from './client';
import { fetchAllPolls, fetchVotesOf, nowSeconds } from './lib/polls';
import { fetchMaybePoll, fetchMaybeVoteRecord, findVoteRecordPda } from './generated';
import { describeError } from './lib/errors';

const REFRESH_MS = 15_000;

/**
 * Current unix time in seconds, ticking every `intervalMs`.
 * Forces a re-render so time-based state (e.g. a poll reaching its end time) updates
 * even when SWR refetches identical on-chain data and skips re-rendering.
 */
export function useNow(intervalMs = 1_000): bigint {
  const [now, setNow] = useState(nowSeconds);
  useEffect(() => {
    const id = setInterval(() => setNow(nowSeconds()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** The connected wallet (or null). */
export const useWallet = () => useConnectedWallet(client);

/** Address of the connected wallet as a Kit `Address` (or undefined). */
export function useWalletAddress(): Address | undefined {
  const wallet = useWallet();
  return wallet ? address(wallet.account.address) : undefined;
}

export function usePolls() {
  return useSWR(['polls'], () => fetchAllPolls(client.rpc), { refreshInterval: REFRESH_MS });
}

export function usePoll(address: Address | undefined) {
  return useSWR(address ? ['poll', address] : null, async () => {
    const account = await fetchMaybePoll(client.rpc, address!);
    return account.exists ? { ...account.data, address: account.address } : null;
  }, { refreshInterval: REFRESH_MS });
}

/** The VoteRecord of `voter` on `poll`, or null if they have not voted. */
export function useMyVote(poll: Address | undefined, voter: Address | undefined) {
  return useSWR(poll && voter ? ['vote', poll, voter] : null, async () => {
    const [pda] = await findVoteRecordPda({ poll: poll!, voter: voter! });
    const account = await fetchMaybeVoteRecord(client.rpc, pda);
    return account.exists ? account.data : null;
  });
}

export function useMyVotes(voter: Address | undefined) {
  return useSWR(voter ? ['votes', voter] : null, () => fetchVotesOf(client.rpc, voter!));
}

export type TxState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; signature: string }
  | { status: 'error'; message: string };

/**
 * Sends instructions signed by the connected wallet, then refreshes every cached query.
 * Exposes a simple state machine for the UI (pending / success + signature / error).
 */
export function useSendInstructions() {
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<TxState>({ status: 'idle' });

  async function send(instructions: Instruction[]): Promise<string | null> {
    setState({ status: 'pending' });
    try {
      const result = await client.sendTransaction(instructions);
      const signature = result.context.signature;
      setState({ status: 'success', signature });
      await mutate(() => true); // revalidate all SWR keys
      return signature;
    } catch (error) {
      console.error(error);
      setState({ status: 'error', message: describeError(error) });
      return null;
    }
  }

  return { state, send, reset: () => setState({ status: 'idle' }) };
}
