use anchor_lang::prelude::*;

use crate::{constants::*, error::VoteError, state::Poll};

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct CreatePoll<'info> {
    /// Creator of the poll: signs and pays the rent of the Poll account.
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Poll::INIT_SPACE,
        seeds = [POLL_SEED, authority.key().as_ref(), poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_poll(
    ctx: Context<CreatePoll>,
    poll_id: u64,
    title: String,
    description: String,
    options: Vec<String>,
    end_time: i64,
) -> Result<()> {
    // --- Validation (every check rejects the whole transaction) ---
    require!(!title.trim().is_empty(), VoteError::TitleEmpty);
    require!(title.len() <= MAX_TITLE_LEN, VoteError::TitleTooLong);
    require!(
        description.len() <= MAX_DESCRIPTION_LEN,
        VoteError::DescriptionTooLong
    );
    require!(options.len() >= MIN_OPTIONS, VoteError::NotEnoughOptions);
    require!(options.len() <= MAX_OPTIONS, VoteError::TooManyOptions);
    for option in &options {
        require!(!option.trim().is_empty(), VoteError::OptionEmpty);
        require!(option.len() <= MAX_OPTION_LEN, VoteError::OptionTooLong);
    }
    let now = Clock::get()?.unix_timestamp;
    require!(end_time > now, VoteError::EndTimeInPast);

    // --- Write the poll ---
    let poll = &mut ctx.accounts.poll;
    poll.authority = ctx.accounts.authority.key();
    poll.poll_id = poll_id;
    poll.title = title;
    poll.description = description;
    poll.vote_counts = vec![0; options.len()];
    poll.options = options;
    poll.end_time = end_time;
    poll.total_votes = 0;
    poll.is_active = true;
    poll.bump = ctx.bumps.poll;

    msg!("Poll {} created with {} options", poll_id, poll.options.len());
    Ok(())
}
