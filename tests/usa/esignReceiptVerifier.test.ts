import assert from "node:assert/strict"
import {
  canonicalUSReceiptBytes, verifyUSOfflineEvidenceReceipt,
  type USEvidenceReceiptV1,
} from "../../src/usa/esignReceiptVerifier.ts"

// Ephemeral synthetic key pair; not a signer identity credential.
const original: USEvidenceReceiptV1 = {
  version: "docwallet-us-evidence-v1",
  eventId: "e4d694c2-e787-4f48-8e59-5d8a34d7b9ec",
  eventType: "sign_intent_recorded",
  documentSha256: "a".repeat(64),
  signerOpaqueId: "synthetic_actor_1",
  sourceIssuerId: "synthetic_gateway_1",
  occurredAt: "2026-10-25T22:00:00Z",
}
const hex = async (buf: Uint8Array) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(buf).buffer)))
    .map(x => x.toString(16).padStart(2,"0")).join("")

async function setup() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"],
  )
  const publicSpki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey))
  const pin = await hex(publicSpki)
  const sign = async (r: USEvidenceReceiptV1) =>
    new Uint8Array(await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" }, pair.privateKey, new Uint8Array(canonicalUSReceiptBytes(r)).buffer,
    ))
  const verify = (r: USEvidenceReceiptV1, sig: Uint8Array, expected = original, trustedPin = pin) =>
    verifyUSOfflineEvidenceReceipt(
      r, sig, publicSpki, trustedPin,
      expected.documentSha256, expected.signerOpaqueId, expected.sourceIssuerId,
      expected.eventId,
    )
  return { sign, verify, pin }
}

Deno.test("pinned US service key verifies a canonical synthetic receipt, never a human signature", async () => {
  const t = await setup()
  const result = await t.verify(original, await t.sign(original))
  assert.equal(result.verified, true)
  assert.equal(result.signatureValid, true)
  assert.equal(result.trustedKeyMatched, true)
  assert.equal(result.eventMatched, true)
  assert.equal(result.signerIdentityLegallyVerified, false)
  assert.equal(result.signingValidityEstablished, false)
})

Deno.test("changing recorded signer, document, event or event type breaks signed evidence", async () => {
  const t = await setup()
  const sig = await t.sign(original)
  const substitutions: USEvidenceReceiptV1[] = [
    { ...original, documentSha256: "b".repeat(64) },
    { ...original, signerOpaqueId: "synthetic_actor_2" },
    { ...original, sourceIssuerId: "synthetic_gateway_2" },
    { ...original, eventId: "e4d694c2-e787-4f48-8e59-5d8a34d7b9ed" },
    { ...original, eventType: "document_viewed" },
  ]
  for (const altered of substitutions) {
    const result = await t.verify(altered, sig)
    assert.equal(result.verified, false)
  }
})

Deno.test("stolen unpinned key or invalid signature cannot authenticate event receipts", async () => {
  const t = await setup()
  const sig = await t.sign(original)
  const wrongPin = await t.verify(original, sig, original, "f".repeat(64))
  assert.equal(wrongPin.trustedKeyMatched, false)
  assert.equal(wrongPin.verified, false)
  sig[0] ^= 0x40
  const alteredSignature = await t.verify(original, sig)
  assert.equal(alteredSignature.signatureValid, false)
  assert.equal(alteredSignature.verified, false)
})

Deno.test("a valid signature for one event is not a valid receipt for another expected event", async () => {
  const t = await setup()
  const alteredExpectation = { ...original, eventId: "e4d694c2-e787-4f48-8e59-5d8a34d7b9ed" }
  const r = await t.verify(original, await t.sign(original), alteredExpectation)
  assert.equal(r.eventMatched, false)
  assert.equal(r.verified, false)
})

Deno.test("rejects invalid source dates, malformed IDs and unsigned empty signatures", async () => {
  assert.throws(() => canonicalUSReceiptBytes({ ...original, occurredAt: "2026-02-30T22:00:00Z" }))
  assert.throws(() => canonicalUSReceiptBytes({ ...original, signerOpaqueId: "arbitrary\nvalue" }))
  const t = await setup()
  await assert.rejects(t.verify(original, new Uint8Array(0)))
})
