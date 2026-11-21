# Security Policy

## Scope

This policy covers the **SolanaVote** on-chain program:

| | |
|---|---|
| Program ID | `6oDhsVkgdj2H7eoR9qQdVAXNm2oCszVWgYQfF5vg6SG7` |
| Network | Solana Devnet |
| Source | `programs/solana-vote/` |

SolanaVote is a certification project deployed on **Devnet only**. It holds no real funds.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report them privately through GitHub:
**[Report a vulnerability](https://github.com/helasnoussi/Solana-vote/security/advisories/new)**

Include, if possible:
- a description of the issue and its impact;
- the instruction and accounts involved;
- steps or a test reproducing it.

Reports in English or French are welcome. You should receive an answer within 7 days.

## Known design limitations (not vulnerabilities)

- **One vote per wallet, not per person**: anyone can create several wallets (Sybil attack).
- **Votes are public**: voter addresses and choices are visible on-chain by design.
