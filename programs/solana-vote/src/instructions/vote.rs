use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::VoteError,
    state::{Poll, VoteRecord},
};

#[derive(Accounts)]
pub struct Vote<'info> {
    /// The voter: signs the transaction and pays the rent of their VoteRecord.
    #[account(mut)]
    pub voter: Signer<'info>,

    /// The poll being voted on. `Account<Poll>` already checks that this
    /// account belongs to our program and really is a Poll; the seeds check
    /// additionally proves it is the canonical PDA of (authority, poll_id).
    #[account(
        mut,
        seeds = [POLL_SEED, poll.authority.as_ref(), poll.poll_id.to_le_bytes().as_ref()],
        bump = poll.bump
    )]
    pub poll: Account<'info, Poll>,

    /// One VoteRecord per (poll, voter). `init` fails if it already exists:
    /// this is what makes a second vote from the same wallet impossible.
    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [VOTE_SEED, poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}

pub fn handle_vote(ctx: Context<Vote>, option_index: u8) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let now = Clock::get()?.unix_timestamp;

    // --- Is the poll open? ---
    require!(poll.is_active, VoteError::PollClosed);
    require!(now < poll.end_time, VoteError::PollEnded);

    // --- Does the option exist? ---
    let index = option_index as usize;
    require!(index < poll.options.len(), VoteError::InvalidOption);

    // --- Count the vote (checked_add: never overflow silently) ---
    poll.vote_counts[index] = poll.vote_counts[index]
        .checked_add(1)
        .ok_or(VoteError::Overflow)?;
    poll.total_votes = poll
        .total_votes
        .checked_add(1)
        .ok_or(VoteError::Overflow)?;

    // --- Keep a public proof of the vote ---
    let record = &mut ctx.accounts.vote_record;
    record.poll = poll.key();
    record.voter = ctx.accounts.voter.key();
    record.selected_option = option_index;
    record.voted_at = now;
    record.bump = ctx.bumps.vote_record;

    msg!("Vote recorded for option {} of poll {}", option_index, poll.poll_id);
    Ok(())
}
