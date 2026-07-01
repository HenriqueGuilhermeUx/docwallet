# DocWallet Android / Google Play

Este projeto agora está preparado para virar app Android usando Capacitor.

## O que já foi configurado

- App ID Android: `br.com.docwallet.app`
- Nome do app: `DocWallet`
- Web build: `dist`
- Backend padrão: `https://docwallet-backend.onrender.com`
- Workflow GitHub Actions: `Build Android App`

## Como gerar o APK pelo GitHub

1. Abra o repositório `docwallet` no GitHub.
2. Clique em `Actions`.
3. Clique no workflow `Build Android App`.
4. Clique em `Run workflow`.
5. Aguarde finalizar.
6. Baixe o artifact `docwallet-android-debug-apk`.
7. Instale o APK em um Android para testar.

## Como gerar AAB para Google Play

O workflow também gera:

`docwallet-android-release-aab-unsigned`

Esse AAB ainda é sem assinatura de produção. Para publicar na Google Play, será necessário configurar assinatura.

## Próxima etapa: assinatura de produção

Para publicar oficialmente, gere uma chave Android e configure estes secrets no GitHub:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Depois o workflow pode ser ajustado para assinar o AAB automaticamente.

## Observação sobre carteira cripto no app

MetaMask normalmente funciona melhor abrindo no navegador/carteira. Dentro do app Android, a conexão Web3 pode depender de deep link ou wallet externa. O fluxo principal do app pode usar login, documentos, assinatura, compartilhamento e Pix. Para validação cripto, mantenha opção de abrir pelo navegador quando necessário.

## Checklist Google Play

Antes de enviar:

- Ícone 512x512
- Feature graphic 1024x500
- Screenshots do app
- Política de privacidade pública
- Termos de uso
- Descrição curta
- Descrição completa
- Categoria: Produtividade ou Ferramentas
- Declaração de segurança de dados
- AAB assinado
