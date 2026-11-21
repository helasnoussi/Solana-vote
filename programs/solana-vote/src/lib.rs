pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6oDhsVkgdj2H7eoR9qQdVAXNm2oCszVWgYQfF5vg6SG7");

// Security contact information embedded in the program binary
// (read by Solana Explorer). Skipped when the crate is used as a library (CPI).
#[cfg(not(feature = "no-entrypoint"))]
solana_security_txt::security_txt! {
    name: "SolanaVote",
    project_url: "https://github.com/helasnoussi/Solana-vote",
    contacts: "link:https://github.com/helasnoussi/Solana-vote/security/advisories/new",
    policy: "https://github.com/helasnoussi/Solana-vote/blob/main/SECURITY.md",
    preferred_languages: "en,fr",
    source_code: "https://github.com/helasnoussi/Solana-vote"
}

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
