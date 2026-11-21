import {
  type Address,
  type Base58EncodedBytes,
  type GetProgramAccountsMemcmpFilter,
  type ReadonlyUint8Array,
  getBase58Decoder,
  getBase64Encoder,
} from '@solana/kit';
import {
  getPollDecoder,
  getVoteRecordDecoder,
  POLL_DISCRIMINATOR,
  SOLANA_VOTE_PROGRAM_ADDRESS,
  VOTE_RECORD_DISCRIMINATOR,
  type Poll,
  type VoteRecord,
} from '../generated';
import type { AppClient } from '../client';

export type PollWithAddress = Poll & { address: Address };
export type VoteRecordWithAddress = VoteRecord & { address: Address };

type Rpc = AppClient['rpc'];

const base58 = (bytes: ReadonlyUint8Array) => getBase58Decoder().decode(bytes) as Base58EncodedBytes;

const memcmp = (offset: bigint, bytes: Base58EncodedBytes): GetProgramAccountsMemcmpFilter => ({
  memcmp: { offset, bytes, encoding: 'base58' },
});

/** Fetches every account of one type, filtered by its 8-byte Anchor discriminator. */
async function fetchProgramAccounts(
  rpc: Rpc,
  discriminator: ReadonlyUint8Array,
  extraFilters: { offset: bigint; bytes: Base58EncodedBytes }[] = [],
) {
  const accounts = await rpc
    .getProgramAccounts(SOLANA_VOTE_PROGRAM_ADDRESS, {
      encoding: 'base64',
      filters: [memcmp(0n, base58(discriminator)), ...extraFilters.map((f) => memcmp(f.offset, f.bytes))],
    })
    .send();
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    bytes: getBase64Encoder().encode(account.data[0]),
  }));
}

/** All polls created with the program, newest first. */
export async function fetchAllPolls(rpc: Rpc): Promise<PollWithAddress[]> {
  const raw = await fetchProgramAccounts(rpc, POLL_DISCRIMINATOR);
  return raw
    .map(({ address, bytes }) => ({ ...getPollDecoder().decode(bytes), address }))
    .sort((a, b) => Number(b.pollId - a.pollId));
}

/**
 * All votes cast by one wallet.
 * VoteRecord layout: discriminator (8) | poll (32) | voter (32) | …  -> voter at offset 40.
 */
export async function fetchVotesOf(rpc: Rpc, voter: Address): Promise<VoteRecordWithAddress[]> {
  const raw = await fetchProgramAccounts(rpc, VOTE_RECORD_DISCRIMINATOR, [
    { offset: 40n, bytes: voter as unknown as Base58EncodedBytes },
  ]);
  return raw
    .map(({ address, bytes }) => ({ ...getVoteRecordDecoder().decode(bytes), address }))
    .sort((a, b) => Number(b.votedAt - a.votedAt));
}

// ---------- Helpers ----------

export const nowSeconds = () => BigInt(Math.floor(Date.now() / 1000));

export type PollStatus = 'open' | 'ended' | 'closed';

export function pollStatus(poll: Poll): PollStatus {
  if (!poll.isActive) return 'closed';
  if (nowSeconds() >= poll.endTime) return 'ended';
  return 'open';
}

export const formatDate = (unixSeconds: bigint) =>
  new Date(Number(unixSeconds) * 1000).toLocaleString();

export const shortAddress = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;

export function percent(part: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return Math.round((Number(part) / Number(total)) * 1000) / 10;
}
