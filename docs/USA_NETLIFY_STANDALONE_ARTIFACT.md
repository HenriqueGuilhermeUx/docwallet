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
