/**
 * DocWallet USA — signed document byte-integrity preflight, OFFLINE.
 *
 * The bytes checked here must be the exact canonical bytes retained in the
 * server evidence archive, not regenerated from editor HTML / preview text.
 * SHA-256 demonstrates byte consistency ONLY. It cannot prove signer's
 * identity, legal acceptance, signature timing or enforceability.
 */
import {
  evaluateUSSignatureEvidence,
  type USSignaturePreflightReport,
  type USSignaturePreflightRequest,
} from "./esignEvidencePreflight.ts"

export interface USByteCheckedSignatureReport extends USSignaturePreflightReport {
  documentByteIntegrityChecked: true
  documentByteIntegrityMatched: boolean
  signerIdentityCryptographicallyVerified: false
  /** Source document is never copied into the report. */
  documentBytesReturned: false
}

export async function evaluateUSSignatureEvidenceFromBytes(
  rawDocument: Uint8Array,
  request: USSignaturePreflightRequest,
): Promise<USByteCheckedSignatureReport> {
  if (!(rawDocument instanceof Uint8Array) || rawDocument.byteLength === 0 ||
      rawDocument.byteLength > 20_000_000) {
    throw new Error("Document byte size outside US E-SIGN proof budget")
  }
  const base = evaluateUSSignatureEvidence(request)
  // Hash the exact buffer slice visible to this request, never the entire
  // underlying ArrayBuffer (e.g. when passed a Uint8Array subarray).
  const hash = await crypto.subtle.digest("SHA-256", rawDocument.slice())
  const actual = Array.from(new Uint8Array(hash))
    .map(v => v.toString(16).padStart(2, "0")).join("")
  const expected = request.signature.documentSha256
  const matched = /^[a-f0-9]{64}$/i.test(expected) && actual === expected.toLowerCase()
  if (!matched) {
    return {
      ...base,
      status: "NEEDS_EVIDENCE",
      missing: [...new Set([...base.missing, "canonical_document_bytes_hash_mismatch"])],
      documentByteIntegrityChecked: true,
      documentByteIntegrityMatched: false,
      signerIdentityCryptographicallyVerified: false,
      documentBytesReturned: false,
    }
  }
  return {
    ...base,
    documentByteIntegrityChecked: true,
    documentByteIntegrityMatched: true,
    signerIdentityCryptographicallyVerified: false,
    documentBytesReturned: false,
  }
}
