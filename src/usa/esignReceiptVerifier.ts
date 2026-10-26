/**
 * DocWallet USA — OFFLINE provenance check for a server-signed evidence receipt.
 *
 * This proves ONLY that a receipt payload was signed using a private key
 * corresponding to an independently pinned public key. It does NOT verify
 * the human signer, notarization, document enforceability or timestamp truth.
 * The trusted key pin and independently verified actor/document identifiers
 * MUST come from a trusted US backend, never from the receipt itself.
 *
 * A receipt is an append-only evidence assertion, NOT an e-signature.
 * No code in this file is wired to an existing Brazil signing flow.
 */
export interface USEvidenceReceiptV1 {
  version: "docwallet-us-evidence-v1"
  eventId: string
  eventType: "document_viewed" | "sign_intent_recorded"
  documentSha256: string
  signerOpaqueId: string
  sourceIssuerId: string
  occurredAt: string
}

export interface USVerifiedEvidenceReceipt {
  signatureValid: boolean
  documentMatched: boolean
  signerMatched: boolean
  trustedKeyMatched: boolean
  verified: boolean
  signerIdentityLegallyVerified: false
  signingValidityEstablished: false
}

const hexDigest = /^[0-9a-fA-F]{64}$/
const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
const safeOpaque = /^[A-Za-z0-9_-]{3,128}$/

function assertReceipt(r: USEvidenceReceiptV1): void {
  if (!r || r.version !== "docwallet-us-evidence-v1" ||
      !uuid.test(r.eventId) ||
      !["document_viewed", "sign_intent_recorded"].includes(r.eventType) ||
      !hexDigest.test(r.documentSha256) ||
      !safeOpaque.test(r.signerOpaqueId) ||
      !safeOpaque.test(r.sourceIssuerId) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(r.occurredAt)) {
    throw new Error("Invalid US receipt evidence envelope")
  }
  const d = new Date(r.occurredAt)
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 19) !== r.occurredAt.slice(0, 19)) {
    throw new Error("Invalid US receipt event time")
  }
}

/**
 * Canonical positional representation excludes JSON property ordering,
 * unknown payload properties and potentially ambiguous string concatenation.
 * An actual protocol must version/sign all meaningful metadata.
 */
export function canonicalUSReceiptBytes(r: USEvidenceReceiptV1): Uint8Array {
  assertReceipt(r)
  return new TextEncoder().encode(JSON.stringify([
    r.version, r.eventId, r.eventType, r.documentSha256.toLowerCase(),
    r.signerOpaqueId, r.sourceIssuerId, r.occurredAt,
  ]))
}

export async function verifyUSOfflineEvidenceReceipt(
  receipt: USEvidenceReceiptV1,
  receiptSignature: Uint8Array,
  independentlyTrustedSpki: Uint8Array,
  independentlyPinnedSpkiSha256: string,
  expectedDocumentSha256: string,
  expectedSignerOpaqueId: string,
  expectedIssuerId: string,
): Promise<USVerifiedEvidenceReceipt> {
  const message = canonicalUSReceiptBytes(receipt)
  if (!(receiptSignature instanceof Uint8Array) ||
      receiptSignature.byteLength < 64 || receiptSignature.byteLength > 512 ||
      !(independentlyTrustedSpki instanceof Uint8Array) ||
      independentlyTrustedSpki.byteLength < 70 || independentlyTrustedSpki.byteLength > 1024 ||
      !hexDigest.test(independentlyPinnedSpkiSha256) ||
      !hexDigest.test(expectedDocumentSha256) ||
      !safeOpaque.test(expectedSignerOpaqueId) ||
      !safeOpaque.test(expectedIssuerId)) {
    throw new Error("Untrusted US evidence verification parameters")
  }

  const spkiHash = await crypto.subtle.digest("SHA-256", independentlyTrustedSpki.slice())
  const calculatedPin = Array.from(new Uint8Array(spkiHash))
    .map(b => b.toString(16).padStart(2, "0")).join("")
  const trustedKeyMatched = calculatedPin === independentlyPinnedSpkiSha256.toLowerCase()
  const documentMatched = receipt.documentSha256.toLowerCase() === expectedDocumentSha256.toLowerCase()
  const signerMatched = receipt.signerOpaqueId === expectedSignerOpaqueId &&
    receipt.sourceIssuerId === expectedIssuerId
  // DO NOT import arbitrary unpinned public keys, even transiently.
  if (!trustedKeyMatched || !documentMatched || !signerMatched) {
    return {
      signatureValid: false, documentMatched, signerMatched, trustedKeyMatched,
      verified: false, signerIdentityLegallyVerified: false, signingValidityEstablished: false,
    }
  }
  let signatureValid = false
  try {
    const key = await crypto.subtle.importKey(
      "spki", independentlyTrustedSpki.slice(),
      { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"],
    )
    signatureValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key, receiptSignature.slice(), message,
    )
  } catch {
    signatureValid = false
  }
  return {
    signatureValid, documentMatched, signerMatched, trustedKeyMatched,
    verified: signatureValid,
    signerIdentityLegallyVerified: false,
    signingValidityEstablished: false,
  }
}
