import assert from "node:assert/strict"
import { canonicalUSReceiptBytes, type USEvidenceReceiptV1 } from "../../src/usa/esignReceiptVerifier.ts"
import { acceptUSReceiptSequenceInLedger, type USReceiptLedgerDependencies } from "../../src/usa/esignReceiptLedgerContract.ts"
import type { USSignedReceiptEnvelope } from "../../src/usa/esignReceiptSequence.ts"

// In-memory state below is ONLY a deterministic synthetic test fixture.
// NEVER reuse it as a real multi-instance or concurrency-safe ledger.
const viewedId = "e4d694c2-e787-4f48-8e59-5d8a34d7b9ec"
const intentId = "e4d694c2-e787-4f48-8e59-5d8a34d7b9ed"
const a: USEvidenceReceiptV1 = {
  version: "docwallet-us-evidence-v1", eventId: viewedId,
  eventType: "document_viewed", documentSha256: "a".repeat(64),
  signerOpaqueId: "synthetic_actor", sourceIssuerId: "synthetic_issuer",
  occurredAt: "2026-10-25T10:00:00Z",
}
const b: USEvidenceReceiptV1 = {
  ...a, eventId: intentId, eventType: "sign_intent_recorded",
  occurredAt: "2026-10-25T10:01:00Z",
}
async function fixture() {
  const key = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"],
  )
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", key.publicKey))
  const sha = new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(spki).buffer))
  const pin = Array.from(sha).map(v=>v.toString(16).padStart(2,"0")).join("")
  const sign = async (r: USEvidenceReceiptV1): Promise<USSignedReceiptEnvelope> => ({
    receipt: r,
    signature: new Uint8Array(await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" }, key.privateKey,
      new Uint8Array(canonicalUSReceiptBytes(r)).buffer,
    )),
  })
  const sequence = [await sign(a), await sign(b)]
  const events = new Set<string>()
  let writes = 0
  const deps: USReceiptLedgerDependencies = {
    trustedIssuerKey: {
      issuerId: a.sourceIssuerId,
      verifiedServiceSpki: spki,
      independentlyPinnedSpkiSha256: pin,
      activatedAt: "2026-10-01T00:00:00Z",
      expiresAt: "2026-12-01T00:00:00Z",
      revokedAt: null,
    },
    serverReceivedAt: "2026-10-26T10:00:00Z",
    expected: {
      documentSha256: a.documentSha256, signerOpaqueId: a.signerOpaqueId,
      sourceIssuerId: a.sourceIssuerId, viewedEventId: viewedId, intentEventId: intentId,
    },
    commitNewEventsAtomically: async pairs => {
      writes++
      const ids = pairs.map(x => x.receipt.eventId)
      if (ids.some(x => events.has(x))) throw new Error("synthetic duplicate")
      for (const id of ids) events.add(id)
      return { committed: true, newlyInserted: 2, eventIds: [ids[0], ids[1]] }
    },
  }
  return { deps, sequence, events, get writes() { return writes } }
}

Deno.test("valid service receipts require a separate server-reported new-event database write", async () => {
  const f = await fixture()
  const result = await acceptUSReceiptSequenceInLedger(f.sequence, f.deps)
  assert.deepEqual(result, {
    accepted: true, reason: "SERVER_REPORTED_COMMIT",
    eventIds: [viewedId, intentId],
    legalValidityEstablished: false,
    databaseDurabilityIndependentlyVerified: false,
  })
  assert.equal(f.writes, 1)
})

Deno.test("identical signed evidence cannot be accepted twice by a unique-event ledger adapter", async () => {
  const f = await fixture()
  assert.equal((await acceptUSReceiptSequenceInLedger(f.sequence, f.deps)).accepted, true)
  const second = await acceptUSReceiptSequenceInLedger(f.sequence, f.deps)
  assert.deepEqual(second, {
    accepted: false, reason: "REPLAY_OR_COMMIT_UNVERIFIED", legalValidityEstablished: false,
  })
})

Deno.test("malicious signer or wrong event never reaches the write adapter", async () => {
  const f = await fixture()
  const tampered = [
    { ...f.sequence[0], receipt: { ...a, signerOpaqueId: "other_user" } },
    f.sequence[1],
  ]
  const result = await acceptUSReceiptSequenceInLedger(tampered, f.deps)
  assert.equal(result.accepted, false)
  assert.equal(result.reason, "BAD_EVIDENCE")
  assert.equal(f.writes, 0)
})

Deno.test("queue acceptance, partial insertion or wrong ACK ID cannot report persisted proof", async () => {
  const f = await fixture()
  const invalid = [
    { committed: false, newlyInserted: 2, eventIds: [viewedId, intentId] },
    { committed: true, newlyInserted: 1, eventIds: [viewedId, intentId] },
    { committed: true, newlyInserted: 2, eventIds: [viewedId, viewedId] },
  ]
  for (const bad of invalid) {
    const deps = {
      ...f.deps,
      commitNewEventsAtomically: async () => bad,
    } as unknown as USReceiptLedgerDependencies
    const result = await acceptUSReceiptSequenceInLedger(f.sequence, deps)
    assert.equal(result.accepted, false)
    assert.equal(result.reason, "REPLAY_OR_COMMIT_UNVERIFIED")
  }
})


Deno.test("revoked service key denies ledger writes even when original ECDSA signatures are correct", async () => {
  const f = await fixture()
  const result = await acceptUSReceiptSequenceInLedger(f.sequence, {
    ...f.deps,
    trustedIssuerKey: {
      ...f.deps.trustedIssuerKey, revokedAt: "2026-10-26T09:00:00Z",
    },
  })
  assert.equal(result.accepted, false)
  assert.equal(result.reason, "BAD_EVIDENCE")
  assert.equal(f.writes, 0)
})

Deno.test("expired issuer keys cannot newly commit signed receipts", async () => {
  const f = await fixture()
  const result = await acceptUSReceiptSequenceInLedger(f.sequence, {
    ...f.deps,
    trustedIssuerKey: {
      ...f.deps.trustedIssuerKey, expiresAt: "2026-10-26T09:00:00Z",
    },
  })
  assert.equal(result.accepted, false)
  assert.equal(f.writes, 0)
})
