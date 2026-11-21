use anchor_lang::prelude::*;

use crate::constants::*;

/// A poll (scrutin). PDA: ["poll", authority, poll_id]
#[account]
#[derive(InitSpace)]
pub struct Poll {
    /// Creator of the poll — the only one allowed to close it.
    pub authority: Pubkey,
    /// Identifier chosen by the creator (part of the PDA seeds).
    pub poll_id: u64,
    #[max_len(MAX_TITLE_LEN)]
    pub title: String,
    #[max_len(MAX_DESCRIPTION_LEN)]
    pub description: String,
    /// Up to MAX_OPTIONS proposals of MAX_OPTION_LEN bytes each.
    #[max_len(MAX_OPTIONS, MAX_OPTION_LEN)]
    pub options: Vec<String>,
    /// vote_counts[i] = number of votes for options[i].
    #[max_len(MAX_OPTIONS)]
    pub vote_counts: Vec<u64>,
    /// Unix timestamp after which voting is refused.
    pub end_time: i64,
    pub total_votes: u64,
    /// false once the authority has closed the poll.
    pub is_active: bool,
    pub bump: u8,
}

/// Proof that `voter` voted on `poll`. PDA: ["vote", poll, voter]
/// Its existence is what prevents a second vote from the same wallet.
#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub selected_option: u8,
    pub voted_at: i64,
    pub bump: u8,
}
