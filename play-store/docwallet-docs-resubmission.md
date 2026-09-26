# DocWallet Docs — submissão Google Play 2026

## App

- Nome: `DocWallet Docs`
- Package name: `br.com.alternativeventures.docwalletdocs`
- Categoria: Produtividade
- Target Android: API 36
- Distribuição inicial recomendada: teste interno; depois produção conforme elegibilidade da conta.

## Build de referência

Usar o AAB assinado gerado pelo workflow Android do App 2.0. Não usar APK de debug para a Play Store.

## Antes de enviar

1. Confirmar que o app abre sem travar.
2. Login, cadastro e logout funcionando.
3. Receber, Entender, Processar, Assinar e Comprovar acessíveis.
4. Envio para assinatura por e-mail/WhatsApp/link funcionando.
5. Retorno ao app atualiza o status da assinatura.
6. Fluxo concluído permite baixar o PDF final.
7. Validação por hash e certificado funcionando.
8. ICP-Brasil continua disponível nos fluxos compatíveis.
9. Política de privacidade: `https://trydocwallet.com/privacy`.
10. Termos: `https://trydocwallet.com/terms`.
11. Exclusão de conta: `https://trydocwallet.com/delete-account`.
12. Ícone da loja corresponde ao app instalado.

## Screenshots

Usar apenas capturas reais do APK instalado, sem mockups que mostrem funções inexistentes.

Prioridade de capturas:

1. Tela Receber / documentos.
2. Intelligence / Entender.
3. DocFlow / Processar.
4. Assinaturas / acompanhamento.
5. Documento concluído com botão `Baixar PDF assinado`.
6. Comprovar / hash e certificados.

## App Access

O app exige login. Criar uma conta exclusiva para a revisão e informar usuário e senha somente no campo `Conteúdo do app > Acesso ao app` do Play Console.

A conta de revisão deve:

- permanecer ativa durante o processo de revisão;
- não depender de biometria;
- não exigir OTP/2FA para o login principal;
- permitir ao revisor acessar as principais áreas do produto.

Nunca armazenar credenciais de revisão no Git.

## Claims

Evitar afirmações absolutas como:

- `substitui cartório`;
- `validade jurídica garantida`;
- `reconhecimento de firma`.

Pode descrever de forma factual:

- carteira e ciclo de documentos;
- assinatura eletrônica com evidências;
- assinatura ICP-Brasil nos fluxos em que o provedor integrado estiver disponível;
- hash SHA-256;
- certificados e provas de integridade;
- download do PDF final assinado.

## Android Developer Verification

Antes da publicação, conferir no Play Console se a identidade do desenvolvedor está verificada e se o package `br.com.alternativeventures.docwalletdocs` está registrado/auto-registrado na página de verificação de desenvolvedor Android.
