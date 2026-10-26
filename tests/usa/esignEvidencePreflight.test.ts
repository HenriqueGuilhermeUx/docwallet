import assert from "node:assert/strict"
import { evaluateUSSignatureEvidence, type USSignaturePreflightRequest } from "../../src/usa/esignEvidencePreflight.ts"

const base: USSignaturePreflightRequest = {
  state: "NY",
  recordKind: "ordinary_commercial_agreement",
  applicableStateLawReviewed: true,
  esignExclusionScreenedByCounsel: true,
  transactionAffectsInterstateOrForeignCommerce: true,
  requiresNotarizationOrWitnessing: false,
  signature: {
    documentSha256: "b".repeat(64),
    signIntentRecorded: true,
    signIntentBoundToHash: true,
    signatureToRecordAssociationVerified: true,
    signerAuthenticationVerified: true,
    signedAuditTrailIntegrityVerified: true,
    reproducibleReadableRecordRetained: true,
  },
}
const consumer = {
  affirmativeElectronicConsent: true,
  consentNotWithdrawn: true,
  paperCopyRightDisclosed: true,
  withdrawalProceduresDisclosed: true,
  contactUpdateProceduresDisclosed: true,
  consentScopeDisclosed: true,
  feesAndConsequencesDisclosed: true,
  hardwareSoftwareRequirementsProvided: true,
  electronicAccessDemonstrated: true,
  materialTechnologyChange: false,
  renewedConsentAfterMaterialChange: false,
}

Deno.test("complete agreement evidence NEVER certifies enforceability or auto-signing", () => {
  const report = evaluateUSSignatureEvidence(base)
  assert.equal(report.status, "TECHNICAL_EVIDENCE_COMPLETE")
  assert.equal(report.legalValidityVerified, false)
  assert.equal(report.eligibleForAutomaticSigning, false)
  assert.deepEqual(report.sourceSections, ["15 USC 7001", "15 USC 7002", "15 USC 7003"])
})

Deno.test("unsigned intent, document hash, authenticity, or audit integrity require evidence", () => {
  for (const changes of [
    { signIntentRecorded: false },
    { signIntentBoundToHash: false },
    { documentSha256: "unverified" },
    { signerAuthenticationVerified: false },
    { signedAuditTrailIntegrityVerified: false },
    { reproducibleReadableRecordRetained: false },
  ]) {
    const report = evaluateUSSignatureEvidence({ ...base, signature: { ...base.signature, ...changes } })
    assert.equal(report.status, "NEEDS_EVIDENCE")
    assert.equal(report.eligibleForAutomaticSigning, false)
  }
})

Deno.test("wills, court records and notarial cases always require special review", () => {
  for (const recordKind of ["will_or_testamentary_trust", "family_law", "court_document", "ucc_or_special_commercial", "public_health_or_safety_notice", "unknown"] as const) {
    assert.equal(evaluateUSSignatureEvidence({ ...base, recordKind }).status, "SPECIAL_RULES_REVIEW")
  }
  assert.equal(evaluateUSSignatureEvidence({
    ...base, requiresNotarizationOrWitnessing: true,
  }).status, "SPECIAL_RULES_REVIEW")
})

Deno.test("consumer written disclosure requires specific ESIGN 7001(c) evidence", () => {
  const noConsent = evaluateUSSignatureEvidence({
    ...base, recordKind: "consumer_written_notice",
  })
  assert.equal(noConsent.status, "NEEDS_EVIDENCE")
  const complete = evaluateUSSignatureEvidence({
    ...base, recordKind: "consumer_written_notice", consumer,
  })
  assert.equal(complete.status, "TECHNICAL_EVIDENCE_COMPLETE")
  assert.equal(complete.legalValidityVerified, false)
  const missing = evaluateUSSignatureEvidence({
    ...base, recordKind: "consumer_written_notice", consumer: {
      ...consumer, electronicAccessDemonstrated: false, consentNotWithdrawn: false,
    },
  })
  assert.deepEqual(missing.missing.filter(s => s.includes("consent") || s.includes("demonstration")),
    ["consent_not_withdrawn", "electronic_access_demonstration"])
})

Deno.test("material technology change requires renewed consumer e-consent", () => {
  const report = evaluateUSSignatureEvidence({
    ...base, recordKind: "consumer_written_notice",
    consumer: { ...consumer, materialTechnologyChange: true },
  })
  assert.equal(report.status, "NEEDS_EVIDENCE")
  assert.ok(report.missing.includes("renewed_consent_after_technology_change"))
})

Deno.test("unknown state and omitted notarization screen are rejected", () => {
  assert.throws(() => evaluateUSSignatureEvidence({ ...base, state: "AA" }))
  assert.throws(() => evaluateUSSignatureEvidence({
    ...base, requiresNotarizationOrWitnessing: undefined as unknown as false,
  }))
})

Deno.test("state law and statutory exception review are never inferred", () => {
  const x = evaluateUSSignatureEvidence({
    ...base, applicableStateLawReviewed: false, esignExclusionScreenedByCounsel: false,
  })
  assert.equal(x.status, "NEEDS_EVIDENCE")
  assert.ok(x.missing.includes("state_law_review"))
  assert.ok(x.missing.includes("federal_exception_review"))
})
