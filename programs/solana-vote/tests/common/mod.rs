//! Helpers shared by every test file.
#![allow(dead_code)]

use {
    anchor_lang::{
        prelude::{Clock, Pubkey},
        solana_program::{instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
    solana_vote::state::{Poll, VoteRecord},
};

/// A date far in the future (year 2096): always a valid end_time.
pub const FUTURE: i64 = 4_000_000_000;

/// Fresh in-memory blockchain with the program loaded.
pub fn setup() -> LiteSVM {
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/solana_vote.so"
    ));
    svm.add_program(solana_vote::id(), bytes).unwrap();
    svm
}

/// A new wallet with 10 SOL.
pub fn funded_wallet(svm: &mut LiteSVM) -> Keypair {
    let wallet = Keypair::new();
    svm.airdrop(&wallet.pubkey(), 10_000_000_000).unwrap();
    wallet
}

// ---------- PDA addresses (computed exactly like a frontend would) ----------

pub fn poll_pda(authority: &Pubkey, poll_id: u64) -> Pubkey {
    Pubkey::find_program_address(
        &[
            solana_vote::constants::POLL_SEED,
            authority.as_ref(),
            &poll_id.to_le_bytes(),
        ],
        &solana_vote::id(),
    )
    .0
}

pub fn vote_pda(poll: &Pubkey, voter: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[solana_vote::constants::VOTE_SEED, poll.as_ref(), voter.as_ref()],
        &solana_vote::id(),
    )
    .0
}

// ---------- Transactions ----------

/// Signs `ix` with `signer` (also fee payer) and sends it.
/// Ok(()) on success, Err(logs) on failure.
pub fn send(svm: &mut LiteSVM, ix: Instruction, signer: &Keypair) -> Result<(), Vec<String>> {
    let msg = Message::new_with_blockhash(&[ix], Some(&signer.pubkey()), &svm.latest_blockhash());
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[signer]).unwrap();
    let result = svm.send_transaction(tx).map(|_| ()).map_err(|e| e.meta.logs);
    // New blockhash so two identical transactions never share a signature.
    svm.expire_blockhash();
    result
}

pub fn create_poll(
    svm: &mut LiteSVM,
    authority: &Keypair,
    poll_id: u64,
    title: &str,
    options: &[&str],
    end_time: i64,
) -> Result<(), Vec<String>> {
    let ix = Instruction::new_with_bytes(
        solana_vote::id(),
        &solana_vote::instruction::CreatePoll {
            poll_id,
            title: title.to_string(),
            description: "Workshop vote".to_string(),
            options: options.iter().map(|o| o.to_string()).collect(),
            end_time,
        }
        .data(),
        solana_vote::accounts::CreatePoll {
            authority: authority.pubkey(),
            poll: poll_pda(&authority.pubkey(), poll_id),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    send(svm, ix, authority)
}

pub fn vote(
    svm: &mut LiteSVM,
    voter: &Keypair,
    poll: Pubkey,
    option_index: u8,
) -> Result<(), Vec<String>> {
    let ix = Instruction::new_with_bytes(
        solana_vote::id(),
        &solana_vote::instruction::Vote { option_index }.data(),
        solana_vote::accounts::Vote {
            voter: voter.pubkey(),
            poll,
            vote_record: vote_pda(&poll, &voter.pubkey()),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    send(svm, ix, voter)
}

pub fn close_poll(svm: &mut LiteSVM, signer: &Keypair, poll: Pubkey) -> Result<(), Vec<String>> {
    let ix = Instruction::new_with_bytes(
        solana_vote::id(),
        &solana_vote::instruction::ClosePoll {}.data(),
        solana_vote::accounts::ClosePoll {
            authority: signer.pubkey(),
            poll,
        }
        .to_account_metas(None),
    );
    send(svm, ix, signer)
}

// ---------- Reading accounts ----------

pub fn read_poll(svm: &LiteSVM, address: &Pubkey) -> Poll {
    let account = svm.get_account(address).expect("poll account not found");
    Poll::try_deserialize(&mut account.data.as_slice()).unwrap()
}

pub fn read_vote_record(svm: &LiteSVM, address: &Pubkey) -> VoteRecord {
    let account = svm.get_account(address).expect("vote record not found");
    VoteRecord::try_deserialize(&mut account.data.as_slice()).unwrap()
}

// ---------- Clock (time travel) ----------

pub fn now(svm: &LiteSVM) -> i64 {
    svm.get_sysvar::<Clock>().unix_timestamp
}

pub fn set_time(svm: &mut LiteSVM, unix_timestamp: i64) {
    let mut clock = svm.get_sysvar::<Clock>();
    clock.unix_timestamp = unix_timestamp;
    svm.set_sysvar(&clock);
}

// ---------- Assertions ----------

/// Asserts that a transaction failed with the given Anchor error name.
pub fn assert_error(result: Result<(), Vec<String>>, error_name: &str) {
    let logs = result.expect_err("transaction should have failed");
    assert!(
        logs.iter().any(|l| l.contains(error_name)),
        "expected error {error_name}, logs: {logs:#?}"
    );
}
