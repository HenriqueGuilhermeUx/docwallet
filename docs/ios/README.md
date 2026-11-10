# DocWallet Docs — iOS App Store readiness

This is the `docwallet` repository (Capacitor 6.2.1; Android release scripts), **separate from** `docwallet-native` (Expo 51). The existing Capacitor app ID is `br.com.alternativeventures.docwalletdocs`; the Expo app uses `com.docwallet.app`.

Before any TestFlight registration or final release, confirm which of these corresponds to each Play Store listing. Do not merge their bundle IDs or accidentally publish a stale app.

The CI only tests unsigned simulator compilation. Signing, functional tests, privacy permissions, distribution and App Store submission are pending; Android production is unchanged.
