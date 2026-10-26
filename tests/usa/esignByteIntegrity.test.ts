import assert from "node:assert/strict"
import { evaluateUSSignatureEvidenceFromBytes } from "../../src/usa/esignByteIntegrity.ts"
import type { USSignaturePreflightRequest } from "../../src/usa/esignEvidencePreflight.ts"

const helloSHA256 = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
const request: USSignaturePreflightRequest = {
  state: "CA",
  recordKind: "ordinary_commercial_agreement",
  applicableStateLawReviewed: true,
  esignExclusionScreenedByCounsel: true,
  transactionAffectsInterstateOrForeignCommerce: true,
  requiresNotarizationOrWitnessing: false,
  signature: {
    documentSha256: helloSHA256,
    signIntentRecorded: true,
    signIntentBoundToHash: true,
    signatureToRecordAssociationVerified: true,
    signerAuthenticationVerified: true,
    signedAuditTrailIntegrityVerified: true,
    reproducibleReadableRecordRetained: true,
  },
}
const bytes = (s: string) => new TextEncoder().encode(s)

Deno.test("exact canonical bytes match but never certify signer identity or enforceability", async () => {
  const r = await evaluateUSSignatureEvidenceFromBytes(bytes("hello"), request)
  assert.equal(r.documentByteIntegrityMatched, true)
  assert.equal(r.status, "TECHNICAL_EVIDENCE_COMPLETE")
  assert.equal(r.legalValidityVerified, false)
  assert.equal(r.eligibleForAutomaticSigning, false)
  assert.equal(r.signerIdentityCryptographicallyVerified, false)
  assert.equal(r.documentBytesReturned, false)
  assert.equal(JSON.stringify(r).includes("hello"), false)
})

Deno.test("document byte change requires evidence even if all asserted flags are true", async () => {
  const r = await evaluateUSSignatureEvidenceFromBytes(bytes("hello!"), request)
  assert.equal(r.documentByteIntegrityMatched, false)
  assert.equal(r.status, "NEEDS_EVIDENCE")
  assert.ok(r.missing.includes("canonical_document_bytes_hash_mismatch"))
})

Deno.test("only the actual Uint8Array slice is hashed", async () => {
  const full = bytes("xhelloz")
  const r = await evaluateUSSignatureEvidenceFromBytes(full.subarray(1, 6), request)
  assert.equal(r.documentByteIntegrityMatched, true)
})

Deno.test("wrong hash, zero bytes and over-budget size all fail closed", async () => {
  const wrong = await evaluateUSSignatureEvidenceFromBytes(bytes("hello"), {
    ...request, signature: { ...request.signature, documentSha256: "bad" },
  })
  assert.equal(wrong.status, "NEEDS_EVIDENCE")
  assert.ok(wrong.missing.includes("canonical_document_bytes_hash_mismatch"))
  await assert.rejects(evaluateUSSignatureEvidenceFromBytes(new Uint8Array(0), request))
  await assert.rejects(evaluateUSSignatureEvidenceFromBytes(new Uint8Array(20_000_001), request))
})

Deno.test("other E-SIGN statutory blockers remain blocked even when the hash matches", async () => {
  const r = await evaluateUSSignatureEvidenceFromBytes(bytes("hello"), {
    ...request, recordKind: "court_document",
  })
  assert.equal(r.documentByteIntegrityMatched, true)
  assert.equal(r.status, "SPECIAL_RULES_REVIEW")
  assert.equal(r.legalValidityVerified, false)
})
