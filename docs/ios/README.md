# DocWallet Docs — iOS App Store readiness

This is the `docwallet` repository (Capacitor 6.2.1; Android release scripts), **separate from** `docwallet-native` (Expo 51). The existing Capacitor app ID is `br.com.alternativeventures.docwalletdocs`; the Expo app uses `com.docwallet.app`.

Before any TestFlight registration or final release, confirm which of these corresponds to each Play Store listing. Do not merge their bundle IDs or accidentally publish a stale app.

The CI only tests unsigned simulator compilation. Signing, functional tests, privacy permissions, distribution and App Store submission are pending; Android production is unchanged.

## Evidências nativas e mitigação de prévias — 16/11/2026

- [Workflow nativo #42889772635](https://github.com/HenriqueGuilhermeUx/docwallet/actions/runs/42889772635) terminou **SUCCESS** na versão anterior da branch, comprovando compilação unsigned e abertura no iPhone simulado; [Web CI #42889772722](https://github.com/HenriqueGuilhermeUx/docwallet/actions/runs/42889772722) também foi SUCCESS. Essa evidência não constitui teste de upload de arquivos ou homologação Apple.
- Commit `40edc39`: o workflow agora exige que o binário compilado use `CFBundleIdentifier=br.com.alternativeventures.docwalletdocs` antes de instalar no simulador; o resultado precisa ser confirmado em CI novo.
- Commit `7ef9e01`: `src/components/AddDocumentModal.tsx` libera a URL temporária `blob:` de prévia de imagem quando substituída ou quando o componente desmonta. Isto reduz a retenção local de prévias de documentos sensíveis, mas **não garante exclusão de cache, persistência, cópias em serviços externos ou limpeza no servidor**. A alteração de UI é compartilhada com web/Android e não deve ser mesclada sem testes de regressão.
- **Pendências:** reconciliar a identidade comercial entre este repositório DocWallet Docs Capacitor e o outro `docwallet-native` Expo; testar seletor de documentos iOS (JPG, PNG, PDF, 10MB, cancelamento), autorização e storage privado com dados sintéticos, revogação de sessão, exclusão de dados, LGPD e App Privacy; preparar credenciais Apple separadamente. Nenhum TestFlight, assinatura, produção ou merge realizado.
