use anchor_lang::prelude::*;

use crate::{constants::*, error::VoteError, state::Poll};

#[derive(Accounts)]
pub struct ClosePoll<'info> {
    /// Must sign: proves ownership of the wallet.
    pub authority: Signer<'info>,

    /// `has_one = authority` checks poll.authority == authority.key():
    /// only the creator of the poll can close it.
    #[account(
        mut,
        seeds = [POLL_SEED, poll.authority.as_ref(), poll.poll_id.to_le_bytes().as_ref()],
        bump = poll.bump,
        has_one = authority @ VoteError::Unauthorized
    )]
    pub poll: Account<'info, Poll>,
}

pub fn handle_close_poll(ctx: Context<ClosePoll>) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    require!(poll.is_active, VoteError::PollClosed);

    // Results stay on-chain and readable; only new votes are refused.
    poll.is_active = false;

    msg!("Poll {} closed with {} votes", poll.poll_id, poll.total_votes);
    Ok(())
}
