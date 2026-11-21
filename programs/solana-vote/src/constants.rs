use anchor_lang::prelude::*;

/// Seed of a Poll PDA: ["poll", authority, poll_id]
#[constant]
pub const POLL_SEED: &[u8] = b"poll";

/// Seed of a VoteRecord PDA: ["vote", poll, voter]
#[constant]
pub const VOTE_SEED: &[u8] = b"vote";

/// Size limits (in bytes) — an account has a fixed size chosen at creation.
/// Plain `usize` consts (no #[constant]): the IDL cannot export usize,
/// and #[max_len] needs usize to compute the account size.
pub const MAX_TITLE_LEN: usize = 64;

pub const MAX_DESCRIPTION_LEN: usize = 256;

pub const MAX_OPTION_LEN: usize = 32;

pub const MIN_OPTIONS: usize = 2;

pub const MAX_OPTIONS: usize = 10;
