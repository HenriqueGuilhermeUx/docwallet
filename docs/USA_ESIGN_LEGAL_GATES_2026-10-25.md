# DocWallet USA — E-SIGN/UETA evidence gate (draft, 2026-10-25)

**Scope:** Alternative Ventures USA / Frente 2 — US legal/regulatory validity preflight. Fully isolated from DocWallet Brazil and from the separate US-localization branch (`feature/usa-localized-preview-20261024`).

## Law reviewed (not a binding legal opinion)

- [15 USC §7001](https://uscode.house.gov/view.xhtml?edition=prelim&req=granuleid%3AUSC-prelim-title15-section7001): electronic signatures/records are not denied effect solely for being electronic in covered interstate/foreign-commerce transactions. This does **not** establish signer authority, acceptance, actual consent, document integrity or enforceability in a particular transaction.
- **§7001(c):** if a statute requires information be made available *in writing to a consumer*, electronic delivery has special affirmative consent, paper options, withdrawal, contact update, fee/consequence, hardware/software and electronic-access-demonstration requirements. A later material technology change can require renewed consent. This is not a universal requirement for every electronic B2B agreement.
- **§7001(d):** where a retention law applies, electronic records must accurately reflect the information and remain accessible and accurately reproducible for the required period.
- [15 USC §7002](https://www.law.cornell.edu/uscode/text/15/7002): state UETA enactments and state-specific alternatives must be reviewed; choosing a two-letter state is **not** state-law certification.
- [15 USC §7003](https://www.law.cornell.edu/uscode/text/15/7003): categories including wills, family law, court documents, certain UCC matters and various specified safety notices may be excluded or governed by special rules. E-notarization and witnessing require independent state/federal assessment.

## Implementation

- `src/usa/esignEvidencePreflight.ts`: **pure technical evidence inventory** requiring recorded intent bound to exact document hash, signer identity evidence, signature-to-record association, protected audit trail, accurate readable retained record, state-law and federal-exception reviews; additional consumer disclosures if the record is legally required to be provided in writing. Ineligible or special categories never automatically pass the special-rules gate.
- `tests/usa/esignEvidencePreflight.test.ts`: synthetic tests for missing hash, intent, identity, audit, consumer disclosures, withdrawn consent, technology changes, special categories and unreviewed states.
- `.github/workflows/usa-esign-preflight-ci.yml`: isolated Deno strict-check and synthetic tests.

## Important limitations

A `TECHNICAL_EVIDENCE_COMPLETE` report is **NOT** a legally valid signature determination. Every response explicitly sets `legalValidityVerified=false` and `eligibleForAutomaticSigning=false`. Evidence flags are placeholders supplied by a future independently audited server, not proof that the event occurred. The reviewer must confirm whether E-SIGN applies, UETA state specifics, statutory exceptions, signer capacity, identity chain, any required record-delivery/retention period, witnessing/notarization and sector-specific rules before use.

No signing endpoint, payment, database, identity provider, cryptographic certificate validator, external notary service, customer record or production deployment is integrated. No existing signature files, screens, state or environment variables are touched.

## Release gates

1. US counsel maps transaction templates and applicable state legal requirements.
2. Independent verification of signer identity, document content digest, event authenticity, tamper-resistant audit evidence and time attestations.
3. Signed consumer consent + access demo workflows only where §7001(c) applies, respecting withdrawal, paper alternatives and technology changes.
4. Regional/state exception handling, evidence retention, deletion/export procedures and special document categories.
5. Synthetic-to-provider contract tests on a separate US identity/e-sign environment, legal signoff and explicit release authorization.

**Status:** branch-only policy/tests, not ready for public use; never merge or deploy without approval.
