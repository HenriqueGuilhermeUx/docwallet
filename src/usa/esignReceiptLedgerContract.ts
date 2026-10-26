/**
 * DocWallet USA — server-side anti-replay ledger CONTRACT for signed receipts.
 *
 * Cryptographic validation alone cannot stop the SAME valid receipt being
 * submitted twice. Only an independently audited US append-only database with
 * UNIQUE(issuer, event_id) and atomic pair insert can enforce real replay
 * prevention. This module calls an injected adapter; it implements NO DB.
 */
import {
  verifyUSReceiptSequence, type USSignedReceiptEnvelope,
} from "./esignReceiptSequence.ts"

export interface USReceiptLedgerDependencies {
  /** Independent pinned registry, never the receipt's embedded key. */
  servicePublicKeySpki: Uint8Array
  independentlyPinnedSpkiSha256: string
  expected: {
    documentSha256: string
    signerOpaqueId: string
    sourceIssuerId: string
    viewedEventId: string
    intentEventId: string
  }
  /**
   * REQUIRED ONE database transaction:
   * - check authorized issuer + tenant and immutable signed payload bytes;
   * - INSERT BOTH unique issuer:event_id entries, OR NEITHER;
   * - ensure BOTH inserted (duplicate/conflict -> fail);
   * - durable COMMIT before returning.
   * A queue ACK or in-memory Map is insufficient.
   */
  commitNewEventsAtomically(
    envelopes: readonly USSignedReceiptEnvelope[],
  ): Promise<{ committed: true; newlyInserted: 2; eventIds: readonly [string, string] }>
}

export type USReceiptLedgerDecision =
  | { accepted: false; reason: "BAD_EVIDENCE" | "REPLAY_OR_COMMIT_UNVERIFIED"; legalValidityEstablished: false }
  | {
      accepted: true
      reason: "SERVER_REPORTED_COMMIT"
      eventIds: readonly [string, string]
      legalValidityEstablished: false
      databaseDurabilityIndependentlyVerified: false
    }

export async function acceptUSReceiptSequenceInLedger(
  sequence: readonly USSignedReceiptEnvelope[],
  deps: USReceiptLedgerDependencies,
): Promise<USReceiptLedgerDecision> {
  const verified = await verifyUSReceiptSequence(
    sequence, deps.servicePublicKeySpki,
    deps.independentlyPinnedSpkiSha256, deps.expected,
  )
  if (verified.status !== "CONSISTENT_SERVICE_ASSERTIONS") {
    return { accepted: false, reason: "BAD_EVIDENCE", legalValidityEstablished: false }
  }
  // The cryptographically checked sequence has already been constrained to
  // independent expected IDs. Still require a durable TWO-event DB write.
  const ids: [string, string] = [sequence[0].receipt.eventId, sequence[1].receipt.eventId]
  try {
    const ack = await deps.commitNewEventsAtomically(sequence)
    if (ack?.committed !== true || ack.newlyInserted !== 2 ||
        ack.eventIds?.length !== 2 ||
        ack.eventIds[0] !== ids[0] || ack.eventIds[1] !== ids[1]) {
      return { accepted: false, reason: "REPLAY_OR_COMMIT_UNVERIFIED", legalValidityEstablished: false }
    }
    return {
      accepted: true, reason: "SERVER_REPORTED_COMMIT", eventIds: ids,
      legalValidityEstablished: false,
      databaseDurabilityIndependentlyVerified: false,
    }
  } catch {
    // Intentionally do not report a successful signing event on uncertain
    // database state. A later read-only reconciliation by event ID is needed.
    return { accepted: false, reason: "REPLAY_OR_COMMIT_UNVERIFIED", legalValidityEstablished: false }
  }
}
