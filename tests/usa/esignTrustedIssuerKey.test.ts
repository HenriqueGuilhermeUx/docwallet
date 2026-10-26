import assert from "node:assert/strict"
import { canonicalUSReceiptBytes, type USEvidenceReceiptV1 } from "../../src/usa/esignReceiptVerifier.ts"
import { verifyUSReceiptSequenceWithActiveIssuer, type USTrustedIssuerKey } from "../../src/usa/esignTrustedIssuerKey.ts"

const first="e4d694c2-e787-4f48-8e59-5d8a34d7b9ec"
const second="e4d694c2-e787-4f48-8e59-5d8a34d7b9ed"
const viewed:USEvidenceReceiptV1={
  version:"docwallet-us-evidence-v1",eventId:first,eventType:"document_viewed",
  documentSha256:"a".repeat(64),signerOpaqueId:"synthetic_actor_1",
  sourceIssuerId:"synthetic_service_1",occurredAt:"2026-10-25T22:00:00Z",
}
const intended: USEvidenceReceiptV1 = {
  ...viewed,eventId:second,eventType:"sign_intent_recorded",
  occurredAt:"2026-10-25T22:01:00Z",
}
async function setup() {
  const pair=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"])
  const spki=new Uint8Array(await crypto.subtle.exportKey("spki",pair.publicKey))
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",new Uint8Array(spki).buffer))
  const pin=Array.from(digest).map(v=>v.toString(16).padStart(2,"0")).join("")
  const sign=async (receipt:USEvidenceReceiptV1)=>({
    receipt,signature:new Uint8Array(await crypto.subtle.sign(
      {name:"ECDSA",hash:"SHA-256"},pair.privateKey,
      new Uint8Array(canonicalUSReceiptBytes(receipt)).buffer,
    )),
  })
  const key:USTrustedIssuerKey={
    issuerId:viewed.sourceIssuerId,independentlyPinnedSpkiSha256:pin,
    verifiedServiceSpki:spki,activatedAt:"2026-10-01T00:00:00Z",
    expiresAt:"2026-12-01T00:00:00Z",revokedAt:null,
  }
  const expected={
    sourceIssuerId:viewed.sourceIssuerId,documentSha256:viewed.documentSha256,
    signerOpaqueId:viewed.signerOpaqueId,viewedEventId:first,intentEventId:second,
  }
  return {key,expected,envelopes:[await sign(viewed),await sign(intended)]}
}

Deno.test("active independently pinned issuer permits ONLY service assertions, not human assent",async()=>{
  const f=await setup()
  const r=await verifyUSReceiptSequenceWithActiveIssuer(
    f.envelopes,f.key,"2026-10-26T10:00:00Z",f.expected)
  assert.equal(r.status,"CONSISTENT_SERVICE_ASSERTIONS")
  assert.equal(r.trustedIssuerKeyActiveForNewIngestion,true)
  assert.equal(r.humanSignerVerified,false)
  assert.equal(r.legalValidityEstablished,false)
  assert.equal(r.historicalKeyStateIndependentlyArchived,false)
  assert.equal(r.replayProtectedByDatabase,false)
})

Deno.test("revoked, expired, not-yet-active, mismatched issuer or bad server time rejects evidence",async()=>{
  const f=await setup()
  for (const [key,now] of [
    [{...f.key,revokedAt:"2026-10-26T09:00:00Z"},"2026-10-26T10:00:00Z"],
    [{...f.key,expiresAt:"2026-10-26T09:00:00Z"},"2026-10-26T10:00:00Z"],
    [{...f.key,activatedAt:"2026-11-01T00:00:00Z"},"2026-10-26T10:00:00Z"],
    [{...f.key,issuerId:"other_service"},"2026-10-26T10:00:00Z"],
    [f.key,"2026-02-30T10:00:00Z"],
    [{...f.key,revokedAt:"2026-02-30T10:00:00Z"},"2026-10-26T10:00:00Z"],
  ] as const) {
    const r=await verifyUSReceiptSequenceWithActiveIssuer(f.envelopes,key,now,f.expected)
    assert.equal(r.status,"REJECTED")
    assert.equal(r.trustedIssuerKeyActiveForNewIngestion,false)
  }
})

Deno.test("trusted key metadata cannot fix a wrong public-key pin",async()=>{
  const f=await setup()
  const r=await verifyUSReceiptSequenceWithActiveIssuer(
    f.envelopes,{...f.key,independentlyPinnedSpkiSha256:"f".repeat(64)},
    "2026-10-26T10:00:00Z",f.expected)
  assert.equal(r.status,"REJECTED")
  assert.equal(r.trustedIssuerKeyActiveForNewIngestion,false)
})
