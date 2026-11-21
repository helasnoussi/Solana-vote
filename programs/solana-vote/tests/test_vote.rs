mod common;

use common::*;
use solana_signer::Signer;

/// Creates poll #1 ("A", "B", "C") owned by a new admin; returns its address.
fn poll_with_three_options(svm: &mut litesvm::LiteSVM, end_time: i64) -> anchor_lang::prelude::Pubkey {
    let admin = funded_wallet(svm);
    create_poll(svm, &admin, 1, "Next workshop?", &["A", "B", "C"], end_time).unwrap();
    poll_pda(&admin.pubkey(), 1)
}

#[test]
fn vote_is_counted_and_recorded() {
    let mut svm = setup();
    let poll = poll_with_three_options(&mut svm, FUTURE);
    let voter = funded_wallet(&mut svm);

    vote(&mut svm, &voter, poll, 1).unwrap();

    let state = read_poll(&svm, &poll);
    assert_eq!(state.vote_counts, vec![0, 1, 0]);
    assert_eq!(state.total_votes, 1);

    let record = read_vote_record(&svm, &vote_pda(&poll, &voter.pubkey()));
    assert_eq!(record.poll, poll);
    assert_eq!(record.voter, voter.pubkey());
    assert_eq!(record.selected_option, 1);
    assert_eq!(record.voted_at, now(&svm));
}

#[test]
fn several_voters_are_counted() {
    let mut svm = setup();
    let poll = poll_with_three_options(&mut svm, FUTURE);
    for option in [0, 2, 2, 1, 2] {
        let voter = funded_wallet(&mut svm);
        vote(&mut svm, &voter, poll, option).unwrap();
    }
    let state = read_poll(&svm, &poll);
    assert_eq!(state.vote_counts, vec![1, 1, 3]);
    assert_eq!(state.total_votes, 5);
}

#[test]
fn same_wallet_cannot_vote_twice() {
    let mut svm = setup();
    let poll = poll_with_three_options(&mut svm, FUTURE);
    let voter = funded_wallet(&mut svm);

    vote(&mut svm, &voter, poll, 0).unwrap();
    // Same option or another one: the VoteRecord PDA already exists.
    assert!(vote(&mut svm, &voter, poll, 0).is_err());
    assert!(vote(&mut svm, &voter, poll, 2).is_err());

    let state = read_poll(&svm, &poll);
    assert_eq!(state.vote_counts, vec![1, 0, 0]);
    assert_eq!(state.total_votes, 1);
}

#[test]
fn reject_invalid_option() {
    let mut svm = setup();
    let poll = poll_with_three_options(&mut svm, FUTURE);
    let voter = funded_wallet(&mut svm);
    assert_error(vote(&mut svm, &voter, poll, 3), "InvalidOption");
    assert_error(vote(&mut svm, &voter, poll, 255), "InvalidOption");
}

#[test]
fn reject_vote_after_end_time() {
    let mut svm = setup();
    let end_time = now(&svm) + 3600; // closes in one hour
    let poll = poll_with_three_options(&mut svm, end_time);
    let voter = funded_wallet(&mut svm);

    set_time(&mut svm, end_time); // time travel: exactly at the deadline
    assert_error(vote(&mut svm, &voter, poll, 0), "PollEnded");
}

#[test]
fn vote_just_before_end_time_is_accepted() {
    let mut svm = setup();
    let end_time = now(&svm) + 3600;
    let poll = poll_with_three_options(&mut svm, end_time);
    let voter = funded_wallet(&mut svm);

    set_time(&mut svm, end_time - 1);
    vote(&mut svm, &voter, poll, 0).unwrap();
}
