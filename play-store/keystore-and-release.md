# DocWallet — AAB assinado para Google Play

Este guia prepara o arquivo `.aab` assinado para subir na Google Play.

## 1. Gerar keystore

No Windows, instale Android Studio ou Java JDK. Depois rode no PowerShell:

```powershell
keytool -genkeypair -v -keystore docwallet-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias docwallet
```

Guarde com segurança:

- arquivo `docwallet-release.jks`
- senha do keystore
- alias: `docwallet`
- senha da chave

## 2. Converter keystore para Base64

No PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("docwallet-release.jks")) | Set-Content "docwallet-release-base64.txt"
```

Abra o arquivo `docwallet-release-base64.txt` e copie o conteúdo.

## 3. Criar GitHub Secrets

No GitHub:

`docwallet` → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Crie:

```txt
ANDROID_KEYSTORE_BASE64=conteúdo do docwallet-release-base64.txt
ANDROID_KEYSTORE_PASSWORD=sua senha do keystore
ANDROID_KEY_ALIAS=docwallet
ANDROID_KEY_PASSWORD=sua senha da chave
```

Opcional para blockchain:

```txt
VITE_DOCWALLET_TREASURY_ADDRESS=sua carteira recebedora
```

## 4. Gerar AAB assinado

1. Vá em `Actions`.
2. Abra `Build Android App`.
3. Clique em `Run workflow`.
4. Espere finalizar.
5. Baixe o artifact `docwallet-android-release-aab-signed`.
6. Suba esse `.aab` na Google Play Console.

## 5. Observação importante

Nunca compartilhe o arquivo `.jks`, as senhas ou os secrets. Quem tiver isso pode assinar versões do app.
