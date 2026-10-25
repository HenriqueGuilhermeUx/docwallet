# Alternative Ventures USA — docwallet localization preview

Date: 2026-10-24
Branch: `feature/usa-localized-preview-20261024`
Status: **Preview only — not released, not production-enabled, no US checkout/account activation**.

## Purpose

A safe first step toward the US edition: direct English-language positioning and product discovery, without substituting American currencies, regulatory claims or data providers in existing Brazilian workflows.

## Changes

- `/us` serves a standalone English product preview.
- Files: `src/components/USPreview.tsx`, `src/components/USPreview.css`.
- The existing entry point `src/App.tsx` mounts the preview on that exact path only.
- Localized page title, metadata and `html[lang]` with cleanup on unmount.
- No calls to protected APIs, no user accounts, no pricing and no new form submission.
- Existing Brazilian routes, authentication, financial sources, app workflows, mobile screens, database and providers are untouched.

## Legal and regional boundaries

American signature enforceability, provider selection, identity verification and US-specific contract templates are deferred to regulated/legal research. ICP-Brasil flows and endpoints remain Brazil-only.

## Verification and release gates

- [ ] Run existing lint, tests, typecheck, build and security checks on this branch.
- [ ] Confirm `/us` loads directly and after page refresh under Netlify or the deployed hosting setup.
- [ ] Smoke-test the existing default Brazilian landing, authenticated app and critical actions.
- [ ] Check mobile width 320–430px, tablet and desktop, keyboard navigation, contrast and screen reader semantics.
- [ ] Confirm US sales terms, privacy disclosure, trademark, support and commercial content with product owner.
- [ ] Enable US activation only after region-scoped auth, infrastructure, data residency and entitlements are validated.

**Do not merge, publish, or redirect Brazilian traffic automatically.**

## Operational browser-only demonstration (2026-10-25)

An English SHA-256 integrity checker was added to `/us`. It uses browser WebCrypto for files under 20 MB, supports comparison to a user-provided 64-character hex digest, and does not upload file contents or persist them. Hash matching is not identity verification, a signature, or legal certification. US signature compliance remains in the separate research/adaptation workstream.

## Interactive preview inventory

- `/us`: English document operations overview and local SHA-256 demonstration.
- `/us/workspace`: in-memory sample document list, category filter, search and review status. Metadata is `noindex,nofollow` and is restored when the screen unmounts.
- No real document upload, signature, identity verification or account activation is performed by the sample workspace.
