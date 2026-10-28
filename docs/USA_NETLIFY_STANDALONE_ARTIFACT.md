# DocWallet USA — isolated Netlify review artifact

This is **not a production release**. The GitHub workflow `DocWallet USA standalone Netlify artifact` builds only `usa-preview/index.html`, `usa-preview/main.tsx` and the existing US-only React components. It publishes nothing; the artifact is available for manual review in GitHub Actions.

- GitHub build command: `npx vite build --config vite.usa.config.ts`
- Exact output directory: `dist-usa-docwallet/`
- Approved browser routes: `/`, `/us`, `/us/workspace`
- All other Netlify routes return 404, including BR login, account, share, signature, payment and API paths.
- The artifact contains no PWA, service worker, manifest, Brazilian app entry point or production API URL.
- The CSP denies network connections, form submissions, workers, framing and third-party scripts; `noindex` is set.
- The workspace contains synthetic, in-memory records. The SHA-256 tool hashes a user-selected **non-confidential** file locally; do not use real client documents in demonstrations.

**Do not connect the existing repository directly to the dedicated Netlify project using default Git settings.** The root `netlify.toml` configures the Brazilian application, including production backend URLs, and may override Netlify UI settings. A future approved isolated deploy must use the CI artifact or a separately verified Git build context that cannot inherit the BR configuration.

Target project (not yet deployed): `av-usa-docwallet` (`a5b1cda8-535a-4db2-b01f-07f41c30be76`). Before claiming it is live, verify an actual Netlify deploy ID, deployed SHA/artifact provenance, HTTP 200 on allowed routes, HTTP 404 on BR routes, CSP/noindex headers, no API calls, mobile/desktop visuals and no customer data. Never upload or deploy to the Brazilian site.

## Dedicated Netlify package configuration (2026-10-28)

The USA draft branch now includes `deploy/netlify/docwallet/netlify.toml`. **This does not change the Brazilian root `netlify.toml` and does not deploy anything.** If Git integration is enabled later, set the dedicated project **Package directory** to `deploy/netlify/docwallet` and leave **Base directory** unset; verify the selected config in Netlify's build log before accepting any deploy. The package config builds only `dist-usa-docwallet`, and the build command runs `scripts/usa-netlify-site-guard.mjs` before dependency installation.

The guard fails if the Netlify `SITE_ID` is not `a5b1cda8-535a-4db2-b01f-07f41c30be76`, if `BRANCH` is not `feature/usa-localized-preview-20261024`, if `CONTEXT` is not `production`, or if frontend/API/provider environment keys are inherited. CI exercises both accepted and rejected inputs. **This guard only runs when Netlify actually selects the USA package configuration**; a wrong root-config build can bypass it. The release gate therefore still requires inspecting the real deploy's processed header/redirect rules, matching its source SHA, checking authenticated HTTP 200/404/CSP/noindex and visually reviewing the protected preview. Never accept a Netlify `ready` state alone as proof of isolation.

Keep team SSO enabled for all deploys. Do not set production Brazilian credentials, enable signup or payments, or touch the existing Brazilian Netlify site.
