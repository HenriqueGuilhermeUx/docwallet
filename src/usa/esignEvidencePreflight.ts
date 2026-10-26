/**
 * Alternative Ventures USA — E-SIGN/UETA technical evidence preflight.
 *
 * This pure policy is NOT a legal enforceability opinion, identity provider,
 * notarization service, certificate validation or signature executor.
 * Only a US attorney and applicable state rules can determine legal validity.
 *
 * OFF by default: nothing here is imported by the production app.
 * Public law sources: 15 USC 7001(c),(d), 7002, 7003.
 */
export type USRecordKind =
  | "ordinary_commercial_agreement"
  | "consumer_written_notice"
  | "will_or_testamentary_trust"
  | "family_law"
  | "court_document"
  | "ucc_or_special_commercial"
  | "public_health_or_safety_notice"
  | "unknown"

export interface USSignatureEvidence {
  /** Verified against canonical bytes by the signing/backend service. */
  documentSha256: string
  /** Is the signing intent attributable to this specific exact document? */
  signIntentRecorded: boolean
  signIntentBoundToHash: boolean
  signatureToRecordAssociationVerified: boolean
  signerAuthenticationVerified: boolean
  signedAuditTrailIntegrityVerified: boolean
  reproducibleReadableRecordRetained: boolean
}

export interface USConsumerNoticeEvidence {
  affirmativeElectronicConsent: boolean
  consentNotWithdrawn: boolean
  paperCopyRightDisclosed: boolean
  withdrawalProceduresDisclosed: boolean
  contactUpdateProceduresDisclosed: boolean
  consentScopeDisclosed: boolean
  feesAndConsequencesDisclosed: boolean
  hardwareSoftwareRequirementsProvided: boolean
  electronicAccessDemonstrated: boolean
  materialTechnologyChange: boolean
  renewedConsentAfterMaterialChange: boolean
}

export interface USSignaturePreflightRequest {
  state: string
  recordKind: USRecordKind
  /** Reviewed, not auto-inferred from location or signer's ZIP code. */
  applicableStateLawReviewed: boolean
  esignExclusionScreenedByCounsel: boolean
  transactionAffectsInterstateOrForeignCommerce: boolean
  requiresNotarizationOrWitnessing: boolean
  signature: USSignatureEvidence
  /** Only needed for written disclosures to a consumer. */
  consumer?: USConsumerNoticeEvidence
}

export interface USSignaturePreflightReport {
  jurisdiction: "US"
  status: "NEEDS_EVIDENCE" | "SPECIAL_RULES_REVIEW" | "TECHNICAL_EVIDENCE_COMPLETE"
  missing: string[]
  reason: string
  legalValidityVerified: false
  eligibleForAutomaticSigning: false
  sourceSections: ["15 USC 7001", "15 USC 7002", "15 USC 7003"]
}

const US_STATES = new Set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "))

const SPECIAL_KINDS: USRecordKind[] = [
  "will_or_testamentary_trust",
  "family_law",
  "court_document",
  "ucc_or_special_commercial",
  "public_health_or_safety_notice",
  "unknown",
]

export function evaluateUSSignatureEvidence(input: USSignaturePreflightRequest): USSignaturePreflightReport {
  if (!input || !input.signature ||
      typeof input.state !== "string" || !US_STATES.has(input.state) ||
      typeof input.requiresNotarizationOrWitnessing !== "boolean" ||
      !["ordinary_commercial_agreement","consumer_written_notice",...SPECIAL_KINDS].includes(input.recordKind)) {
    throw new Error("Invalid US e-sign preflight request")
  }
  const e = input.signature
  const missing: string[] = []
  if (!/^[a-fA-F0-9]{64}$/.test(e.documentSha256 || "")) missing.push("document_hash")
  if (e.signIntentRecorded !== true) missing.push("intent")
  if (e.signIntentBoundToHash !== true) missing.push("intent_document_binding")
  if (e.signatureToRecordAssociationVerified !== true) missing.push("signature_record_association")
  if (e.signerAuthenticationVerified !== true) missing.push("signer_authentication")
  if (e.signedAuditTrailIntegrityVerified !== true) missing.push("audit_integrity")
  if (e.reproducibleReadableRecordRetained !== true) missing.push("record_retention")
  if (input.applicableStateLawReviewed !== true) missing.push("state_law_review")
  if (input.esignExclusionScreenedByCounsel !== true) missing.push("federal_exception_review")
  if (input.transactionAffectsInterstateOrForeignCommerce !== true) missing.push("transaction_scope_review")
  if (input.recordKind === "consumer_written_notice") {
    if (!input.consumer) missing.push("consumer_disclosure_record")
    else {
      const c = input.consumer
      for (const [name, value] of [
        ["affirmative_consumer_consent", c.affirmativeElectronicConsent],
        ["consent_not_withdrawn", c.consentNotWithdrawn],
        ["paper_copy_rights", c.paperCopyRightDisclosed],
        ["withdrawal_procedures", c.withdrawalProceduresDisclosed],
        ["contact_update_procedures", c.contactUpdateProceduresDisclosed],
        ["consent_scope", c.consentScopeDisclosed],
        ["fees_consequences", c.feesAndConsequencesDisclosed],
        ["hardware_software", c.hardwareSoftwareRequirementsProvided],
        ["electronic_access_demonstration", c.electronicAccessDemonstrated],
      ] as const) if (value !== true) missing.push(name)
      if (c.materialTechnologyChange === true && c.renewedConsentAfterMaterialChange !== true) {
        missing.push("renewed_consent_after_technology_change")
      }
    }
  }
  const special = SPECIAL_KINDS.includes(input.recordKind) ||
    input.requiresNotarizationOrWitnessing === true
  const status = missing.length ? "NEEDS_EVIDENCE" :
    special ? "SPECIAL_RULES_REVIEW" : "TECHNICAL_EVIDENCE_COMPLETE"
  return {
    jurisdiction: "US", status, missing,
    reason: special
      ? "Special statutory, notarial, court or state exceptions require individual counsel assessment."
      : "Evidence inventory only; enforceability, signer identity and applicable state law are not certified.",
    legalValidityVerified: false,
    eligibleForAutomaticSigning: false,
    sourceSections: ["15 USC 7001", "15 USC 7002", "15 USC 7003"],
  }
}
