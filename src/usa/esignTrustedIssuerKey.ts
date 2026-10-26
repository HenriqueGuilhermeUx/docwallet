/**
 * DocWallet USA — trusted service signing-key lifecycle gate, OFFLINE.
 *
 * Evidence verification for NEW ingestion is allowed only when the
 * independently maintained service registry marks the issuer's pinned
 * P-256 SPKI key active at independently supplied SERVER intake time.
 *
 * Key expiry does not mean historical signed evidence becomes invalid.
 * Historical archives need a distinct signed, dated key-state ledger;
 * this function intentionally rejects expired keys for fresh ingestion.
 *
 * This verifies a SERVICE assertion, NOT the identity or assent of a human.
 */
import {
  verifyUSReceiptSequence,
  type USSignedReceiptEnvelope, type USReceiptSequenceEvidence,
} from "./esignReceiptSequence.ts"

export interface USTrustedIssuerKey {
  issuerId: string
  independentlyPinnedSpkiSha256: string
  verifiedServiceSpki: Uint8Array
  activatedAt: string
  expiresAt: string
  revokedAt: string | null
}

export type USIssuerKeySequenceReport = USReceiptSequenceEvidence & {
  trustedIssuerKeyActiveForNewIngestion: boolean
  historicalKeyStateIndependentlyArchived: false
  humanSignerVerified: false
  legalValidityEstablished: false
}

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
function instant(s: unknown): number | null {
  if (typeof s !== "string" || !TIMESTAMP.test(s)) return null
  const ms=Date.parse(s)
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0,19) !== s.slice(0,19)) return null
  return ms
}

export async function verifyUSReceiptSequenceWithActiveIssuer(
  envelopes: readonly USSignedReceiptEnvelope[],
  independentlyTrustedKey: USTrustedIssuerKey,
  serverReceivedAt: string,
  expected: {
    sourceIssuerId: string
    documentSha256: string
    signerOpaqueId: string
    viewedEventId: string
    intentEventId: string
  },
): Promise<USIssuerKeySequenceReport> {
  const reject = (): USIssuerKeySequenceReport => ({
    status:"REJECTED", reason:"CRYPTOGRAPHIC_PROOF_FAILED",
    eventCount:Array.isArray(envelopes) ? envelopes.length : 0,
    replayProtectedByDatabase:false,
    trustedIssuerKeyActiveForNewIngestion:false,
    historicalKeyStateIndependentlyArchived:false,
    humanSignerVerified:false, legalValidityEstablished:false,
  })
  const received=instant(serverReceivedAt)
  const from=instant(independentlyTrustedKey?.activatedAt)
  const until=instant(independentlyTrustedKey?.expiresAt)
  const revoked=independentlyTrustedKey?.revokedAt === null ? null :
    instant(independentlyTrustedKey?.revokedAt)
  if (received === null || from === null || until === null ||
      !independentlyTrustedKey || !expected ||
      (independentlyTrustedKey.revokedAt !== null && revoked === null) ||
      from >= until || (revoked !== null && revoked < from) ||
      received < from || received >= until ||
      (revoked !== null && received >= revoked) ||
      independentlyTrustedKey.issuerId !== expected.sourceIssuerId ||
      !/^[A-Za-z0-9_-]{3,128}$/.test(independentlyTrustedKey.issuerId) ||
      !(independentlyTrustedKey.verifiedServiceSpki instanceof Uint8Array) ||
      !/^[0-9a-f]{64}$/i.test(independentlyTrustedKey.independentlyPinnedSpkiSha256)) {
    return reject()
  }
  // Registry comes from a separate audited server configuration, never from
  // receipt fields. The downstream signature verifier checks the real SPKI
  // digest and binds the intended event/document/issuer/signer references.
  const proof=await verifyUSReceiptSequence(
    envelopes, independentlyTrustedKey.verifiedServiceSpki,
    independentlyTrustedKey.independentlyPinnedSpkiSha256, expected,
  )
  return {
    ...proof,
    trustedIssuerKeyActiveForNewIngestion:proof.status === "CONSISTENT_SERVICE_ASSERTIONS",
    historicalKeyStateIndependentlyArchived:false,
    humanSignerVerified:false, legalValidityEstablished:false,
  }
}
