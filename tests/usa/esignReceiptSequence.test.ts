import assert from "node:assert/strict"
import { canonicalUSReceiptBytes, type USEvidenceReceiptV1 } from "../../src/usa/esignReceiptVerifier.ts"
import { verifyUSReceiptSequence, type USSignedReceiptEnvelope } from "../../src/usa/esignReceiptSequence.ts"

const documentSha256 = "a".repeat(64)
const viewedEventId = "e4d694c2-e787-4f48-8e59-5d8a34d7b9ec"
const intentEventId = "e4d694c2-e787-4f48-8e59-5d8a34d7b9ed"
const view: USEvidenceReceiptV1 = {
  version: "docwallet-us-evidence-v1",
  eventId: viewedEventId, eventType: "document_viewed", documentSha256,
  signerOpaqueId: "synthetic_signer_1", sourceIssuerId: "synthetic_service_1",
  occurredAt: "2026-10-25T10:00:00Z",
}
const intent: USEvidenceReceiptV1 = {
  ...view, eventId: intentEventId,
  eventType: "sign_intent_recorded", occurredAt: "2026-10-25T10:05:00Z",
}
async function syntheticFixture() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"],
  )
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey))
  const hash = await crypto.subtle.digest("SHA-256", new Uint8Array(spki).buffer)
  const pin = Array.from(new Uint8Array(hash)).map(v => v.toString(16).padStart(2, "0")).join("")
  const sign = async (receipt: USEvidenceReceiptV1): Promise<USSignedReceiptEnvelope> => ({
    receipt,
    signature: new Uint8Array(await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" }, pair.privateKey,
      new Uint8Array(canonicalUSReceiptBytes(receipt)).buffer,
    )),
  })
  const expected = {
    documentSha256,
    signerOpaqueId: view.signerOpaqueId,
    sourceIssuerId: view.sourceIssuerId,
    viewedEventId, intentEventId,
  }
  return { spki, pin, sign, expected }
}

Deno.test("requires two independently expected, signed, ordered events", async () => {
  const f = await syntheticFixture()
  const events = [await f.sign(view), await f.sign(intent)]
  const r = await verifyUSReceiptSequence(events, f.spki, f.pin, f.expected)
  assert.deepEqual(r, {
    status: "CONSISTENT_SERVICE_ASSERTIONS", eventCount: 2, reason: "OK",
    humanSignerVerified: false, legalValidityEstablished: false,
    replayProtectedByDatabase: false,
  })
})

Deno.test("signed receipts in reverse chronological order are rejected", async () => {
  const f = await syntheticFixture()
  const r = await verifyUSReceiptSequence([
    await f.sign(view), await f.sign({ ...intent, occurredAt: "2026-10-25T09:59:00Z" }),
  ], f.spki, f.pin, f.expected)
  assert.equal(r.status, "REJECTED")
  assert.equal(r.reason, "INVALID_ORDER")
})

Deno.test("wrong expected ledger event or document is rejected even with valid service signatures", async () => {
  const f = await syntheticFixture()
  const events = [await f.sign(view), await f.sign(intent)]
  for (const expected of [
    { ...f.expected, intentEventId: "a4d694c2-e787-4f48-8e59-5d8a34d7b9ed" },
    { ...f.expected, documentSha256: "b".repeat(64) },
    { ...f.expected, signerOpaqueId: "synthetic_signer_2" },
  ]) {
    const r = await verifyUSReceiptSequence(events, f.spki, f.pin, expected)
    assert.equal(r.status, "REJECTED")
    assert.equal(r.reason, "CRYPTOGRAPHIC_PROOF_FAILED")
  }
})

Deno.test("duplicates and missing evidence are not interpreted as documented assent", async () => {
  const f = await syntheticFixture()
  const sameId = await f.sign({ ...intent, eventId: viewedEventId })
  const r = await verifyUSReceiptSequence([await f.sign(view), sameId], f.spki, f.pin, f.expected)
  assert.equal(r.status, "REJECTED")
  assert.equal(r.reason, "INVALID_ORDER")
  const incomplete = await verifyUSReceiptSequence([await f.sign(view)], f.spki, f.pin, f.expected)
  assert.equal(incomplete.reason, "INVALID_EVENT")
})

Deno.test("an untrusted issuer pin cannot establish provenance of otherwise valid receipts", async () => {
  const f = await syntheticFixture()
  const events = [await f.sign(view), await f.sign(intent)]
  const r = await verifyUSReceiptSequence(events, f.spki, "c".repeat(64), f.expected)
  assert.equal(r.reason, "CRYPTOGRAPHIC_PROOF_FAILED")
  assert.equal(r.legalValidityEstablished, false)
})
