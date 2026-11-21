pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6oDhsVkgdj2H7eoR9qQdVAXNm2oCszVWgYQfF5vg6SG7");

#[program]
pub mod solana_vote {
    use super::*;

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        poll_id: u64,
        title: String,
        description: String,
        options: Vec<String>,
        end_time: i64,
    ) -> Result<()> {
        crate::instructions::create_poll::handle_create_poll(
            ctx,
            poll_id,
            title,
            description,
            options,
            end_time,
        )
    }

    pub fn vote(ctx: Context<Vote>, option_index: u8) -> Result<()> {
        crate::instructions::vote::handle_vote(ctx, option_index)
    }

    pub fn close_poll(ctx: Context<ClosePoll>) -> Result<()> {
        crate::instructions::close_poll::handle_close_poll(ctx)
    }
}
