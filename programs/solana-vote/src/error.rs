use anchor_lang::prelude::*;

#[error_code]
pub enum VoteError {
    #[msg("The title cannot be empty")]
    TitleEmpty,
    #[msg("The title is too long")]
    TitleTooLong,
    #[msg("The description is too long")]
    DescriptionTooLong,
    #[msg("A poll needs at least 2 options")]
    NotEnoughOptions,
    #[msg("Too many options")]
    TooManyOptions,
    #[msg("An option cannot be empty")]
    OptionEmpty,
    #[msg("An option is too long")]
    OptionTooLong,
    #[msg("The end time must be in the future")]
    EndTimeInPast,
    #[msg("The poll is closed")]
    PollClosed,
    #[msg("The voting period is over")]
    PollEnded,
    #[msg("This option does not exist")]
    InvalidOption,
    #[msg("Only the poll authority can do this")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
