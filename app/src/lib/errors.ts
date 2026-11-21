/** Messages of the program's custom errors (error.rs). Anchor numbers them from 6000. */
const PROGRAM_ERRORS: Record<number, string> = {
  6000: 'The title cannot be empty.',
  6001: 'The title is too long.',
  6002: 'The description is too long.',
  6003: 'A poll needs at least 2 options.',
  6004: 'Too many options (10 maximum).',
  6005: 'An option cannot be empty.',
  6006: 'An option is too long.',
  6007: 'The end time must be in the future.',
  6008: 'The poll is closed.',
  6009: 'The voting period is over.',
  6010: 'This option does not exist.',
  6011: 'Only the poll creator can do this.',
  6012: 'Arithmetic overflow.',
};

/** Walks an error and its `cause` chain, collecting objects to inspect. */
function* errorChain(error: unknown): Generator<Record<string, unknown>> {
  let current: unknown = error;
  for (let depth = 0; current && typeof current === 'object' && depth < 10; depth++) {
    yield current as Record<string, unknown>;
    current = (current as { cause?: unknown }).cause;
  }
}

/** Turns any transaction error into a short, human-readable message. */
export function describeError(error: unknown): string {
  const text = String((error as Error)?.message ?? error);

  for (const e of errorChain(error)) {
    const context = e.context as Record<string, unknown> | undefined;
    const code = context?.code;
    // Custom program errors of solana_vote start at 6000 (Anchor convention).
    if (typeof code === 'number' && PROGRAM_ERRORS[code]) {
      return PROGRAM_ERRORS[code];
    }
    // System program "account already in use" -> the VoteRecord already exists.
    if (typeof code === 'number' && code === 0 && /custom/i.test(String(e.message))) {
      return 'This wallet has already voted on this poll.';
    }
    const logs = context?.logs;
    if (Array.isArray(logs) && logs.some((l) => /already in use/.test(String(l)))) {
      return 'This wallet has already voted on this poll.';
    }
  }

  if (/reject|denied|cancel/i.test(text)) return 'Transaction rejected in the wallet.';
  if (/insufficient|lamports|0x1\b/i.test(text)) return 'Not enough SOL to pay the fees and rent.';
  if (/blockhash/i.test(text)) return 'The transaction expired. Please try again.';
  return text;
}
