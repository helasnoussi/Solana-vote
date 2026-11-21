mod common;

use common::*;
use solana_signer::Signer;

#[test]
fn create_valid_poll() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    create_poll(&mut svm, &admin, 1, "Next workshop?", &["Solana", "Ethereum", "Avalanche"], FUTURE)
        .unwrap();

    let poll = read_poll(&svm, &poll_pda(&admin.pubkey(), 1));
    assert_eq!(poll.authority, admin.pubkey());
    assert_eq!(poll.poll_id, 1);
    assert_eq!(poll.title, "Next workshop?");
    assert_eq!(poll.options, vec!["Solana", "Ethereum", "Avalanche"]);
    assert_eq!(poll.vote_counts, vec![0, 0, 0]);
    assert_eq!(poll.total_votes, 0);
    assert_eq!(poll.end_time, FUTURE);
    assert!(poll.is_active);
}

#[test]
fn same_id_cannot_be_created_twice() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    create_poll(&mut svm, &admin, 7, "Poll", &["A", "B"], FUTURE).unwrap();
    // Same seeds -> same PDA -> already in use.
    assert!(create_poll(&mut svm, &admin, 7, "Poll again", &["A", "B"], FUTURE).is_err());
    // Another id works.
    create_poll(&mut svm, &admin, 8, "Poll", &["A", "B"], FUTURE).unwrap();
}

#[test]
fn reject_empty_title() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    assert_error(create_poll(&mut svm, &admin, 1, "   ", &["A", "B"], FUTURE), "TitleEmpty");
}

#[test]
fn reject_title_too_long() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    let title = "x".repeat(65);
    assert_error(create_poll(&mut svm, &admin, 1, &title, &["A", "B"], FUTURE), "TitleTooLong");
}

#[test]
fn reject_not_enough_options() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    assert_error(create_poll(&mut svm, &admin, 1, "Poll", &["Only one"], FUTURE), "NotEnoughOptions");
}

#[test]
fn reject_too_many_options() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    let options = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]; // 11
    assert_error(create_poll(&mut svm, &admin, 1, "Poll", &options, FUTURE), "TooManyOptions");
}

#[test]
fn reject_empty_option() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    assert_error(create_poll(&mut svm, &admin, 1, "Poll", &["A", ""], FUTURE), "OptionEmpty");
}

#[test]
fn reject_end_time_in_past() {
    let mut svm = setup();
    let admin = funded_wallet(&mut svm);
    let past = now(&svm) - 1;
    assert_error(create_poll(&mut svm, &admin, 1, "Poll", &["A", "B"], past), "EndTimeInPast");
}
