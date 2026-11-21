mod common;

use common::*;
use solana_signer::Signer;

#[test]
fn authority_can_close_and_results_stay_readable() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    create_poll(&mut svm, &admin, 1, "Poll", &["A", "B"], FUTURE).unwrap();
    let poll = poll_pda(&admin.pubkey(), 1);
    let voter = funded_wallet(&mut svm);
    vote(&mut svm, &voter, poll, 1).unwrap();

    close_poll(&mut svm, &admin, poll).unwrap();

    let state = read_poll(&svm, &poll);
    assert!(!state.is_active);
    assert_eq!(state.vote_counts, vec![0, 1]);
    assert_eq!(state.total_votes, 1);
}

#[test]
fn reject_vote_on_closed_poll() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    create_poll(&mut svm, &admin, 1, "Poll", &["A", "B"], FUTURE).unwrap();
    let poll = poll_pda(&admin.pubkey(), 1);
    close_poll(&mut svm, &admin, poll).unwrap();

    let voter = funded_wallet(&mut svm);
    assert_error(vote(&mut svm, &voter, poll, 0), "PollClosed");
}

#[test]
fn reject_close_by_another_wallet() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    create_poll(&mut svm, &admin, 1, "Poll", &["A", "B"], FUTURE).unwrap();
    let poll = poll_pda(&admin.pubkey(), 1);

    let attacker = funded_wallet(&mut svm);
    assert_error(close_poll(&mut svm, &attacker, poll), "Unauthorized");
    assert!(read_poll(&svm, &poll).is_active);
}

#[test]
fn reject_closing_twice() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    create_poll(&mut svm, &admin, 1, "Poll", &["A", "B"], FUTURE).unwrap();
    let poll = poll_pda(&admin.pubkey(), 1);

    close_poll(&mut svm, &admin, poll).unwrap();
    assert_error(close_poll(&mut svm, &admin, poll), "PollClosed");
}
