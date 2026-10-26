/**
 * DocWallet USA — offline ordered evidence receipt sequence verification.
 *
 * Caller-supplied expected IDs must come from an independent immutable
 * US audit ledger, NOT the receipts themselves. This is a consistency
 * preflight, never a replacement for database-level uniqueness, sequence
 * locking, trusted timestamps, signer identity or legal enforceability.
 */
import {
  verifyUSOfflineEvidenceReceipt,
  type USEvidenceReceiptV1,
} from "./esignReceiptVerifier.ts"

export interface USSignedReceiptEnvelope {
  receipt: USEvidenceReceiptV1
  signature: Uint8Array
}

export interface USReceiptSequenceEvidence {
  status: "CONSISTENT_SERVICE_ASSERTIONS" | "REJECTED"
  eventCount: number
  reason: "OK" | "INVALID_ORDER" | "INVALID_EVENT" | "CRYPTOGRAPHIC_PROOF_FAILED"
  humanSignerVerified: false
  legalValidityEstablished: false
  replayProtectedByDatabase: false
}

/**
 * Strict two-event pilot: documented view then intent; same document,
 * actor, issuer, ordered receipt time and independently supplied IDs.
 * Fail closed rather than infer consent from a search result or event count.
 */
export async function verifyUSReceiptSequence(
  sequence: readonly USSignedReceiptEnvelope[],
  trustedServiceSpki: Uint8Array,
  trustedSpkiSha256: string,
  expected: {
    documentSha256: string
    signerOpaqueId: string
    sourceIssuerId: string
    viewedEventId: string
    intentEventId: string
  },
): Promise<USReceiptSequenceEvidence> {
  const result = (reason: USReceiptSequenceEvidence["reason"]): USReceiptSequenceEvidence => ({
    status: reason === "OK" ? "CONSISTENT_SERVICE_ASSERTIONS" : "REJECTED",
    eventCount: Array.isArray(sequence) ? sequence.length : 0,
    reason, humanSignerVerified: false, legalValidityEstablished: false,
    replayProtectedByDatabase: false,
  })
  if (!Array.isArray(sequence) || sequence.length !== 2 ||
      !expected || expected.viewedEventId === expected.intentEventId) {
    return result("INVALID_EVENT")
  }
  const [view, intent] = sequence
  if (!view?.receipt || !intent?.receipt ||
      view.receipt.eventType !== "document_viewed" ||
      intent.receipt.eventType !== "sign_intent_recorded" ||
      view.receipt.eventId.toLowerCase() === intent.receipt.eventId.toLowerCase()) {
    return result("INVALID_ORDER")
  }
  const a = Date.parse(view.receipt.occurredAt)
  const b = Date.parse(intent.receipt.occurredAt)
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) {
    return result("INVALID_ORDER")
  }
  for (const [item, id] of [
    [view, expected.viewedEventId], [intent, expected.intentEventId],
  ] as const) {
    try {
      const proof = await verifyUSOfflineEvidenceReceipt(
        item.receipt, item.signature,
        trustedServiceSpki, trustedSpkiSha256, expected.documentSha256,
        expected.signerOpaqueId, expected.sourceIssuerId, id,
      )
      if (!proof.verified) return result("CRYPTOGRAPHIC_PROOF_FAILED")
    } catch {
      return result("CRYPTOGRAPHIC_PROOF_FAILED")
    }
  }
  return result("OK")
}
