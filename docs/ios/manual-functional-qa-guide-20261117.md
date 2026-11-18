# DocWallet Docs — roteiro de homologação funcional iOS/Android

**Uso exclusivo em ambiente de homologação.** Não utilizar documentos, tokens, contas ou dados de clientes. Não habilitar automaticamente signing, produção ou TestFlight.

## Pré-requisitos verificáveis
- Registrar SHA exato do build testado e comparar `br.com.alternativeventures.docwalletdocs` com a identidade publicada no Google Play; não usar `docwallet-native` como substituto.
- Frontend PR #14 e backend PR #16 devem ser testados juntos em staging com banco e storage isolados. Nenhuma conta de produção pode ter acesso a esse ambiente.
- Criar duas contas exclusivamente sintéticas, A e B; criar PDF fictício, PNG e JPG. Nunca usar captura de documento real.
- Registrar modelo do iPhone/iPad, versão do iOS e versão do Android; guardar screenshots sanitizadas sem IDs, tokens ou PII.

## Execução por cenário

| Código | Procedimento com dados sintéticos | Evidência objetiva para PASS |
| --- | --- | --- |
| DOC-01/02/03 | Selecionar JPG/PNG/PDF em Arquivos ou Fotos quando aplicável; abrir visualizador | Nome, prévia e tipo corretos em dispositivo; sem crash/tela branca |
| DOC-04/05 | Tentar arquivo inválido e PDF acima de 10 MB | Bloqueio antes de criar documento; mensagem clara |
| DOC-06/07/08 | Cancelar seleção, trocar imagem A por B, fechar/reabrir modal | Não reaproveitar arquivo antigo; prévias e URLs temporárias descartadas |
| DOC-09 | Enviar documento fictício na conta A e reabrir | Upload autorizado; GET com Bearer; conteúdo lido somente pela conta A |
| DOC-10 | Expirar/invalidar sessão A e tentar download/preview | HTTP 401; preview removido; nenhuma URL com `?s=` |
| DOC-11 | Induzir offline/503 na homologação e repetir upload | Nenhum sucesso falso nem duplicidade; usuário pode repetir |
| DOC-12 | Tentar acesso da conta B e exclusão por B, depois excluir pela A | B recebe 404 sem ver bytes; A pode excluir; GET/download após exclusão 404; validar storage |
| DOC-13 | Abrir preview; colocar app em background; encerrar sessão; voltar | Preview não reaparece para usuário deslogado; mídia temporária revogada |
| DOC-14 | Repetir seletor, visualização e navegação em iPad, retrato/paisagem | UI sem cortes; navegação, Dynamic Type e VoiceOver utilizáveis |
| Compartilhamento | Criar link temporário com A e acessar com cliente não autenticado | Código de acesso com limites/validade; URL pública sem token de sessão; revogação funcional |

## Evidência e saída
- Para cada caso, registrar `PASS/FAIL/BLOCKED`, SHA, dispositivo, sistema, horário, resposta HTTP sanitizada e link para print/log seguro.
- Para 401/403/404, inspecionar **somente códigos e mensagens genéricas**, jamais gravar o cabeçalho Authorization, QR sensível ou URL com credencial.
- Não aprovar DOC-12 completo enquanto a exclusão de **conta**, backups e retenção não forem validadas no sistema real de homologação.
- Não aprovar distribuição até revisão de Privacy Manifest, políticas, classificação etária, permissões Apple, identidade Play, certificados e titularidade.
- Simulator `simctl launch` é somente evidência de abertura, não de execução dos casos desta tabela.

## Evidências automatizadas já alcançadas
- Backend: PR #16, [run #44167899380](https://github.com/HenriqueGuilhermeUx/docwallet-backend/actions/runs/44167899380) (acesso privado e exclusão usando SQLite).
- Frontend ↔ backend Flask local: [run #44160843919](https://github.com/HenriqueGuilhermeUx/docwallet/actions/runs/44160843919), 5 testes HTTP.
- Web CI: [run #44167336093](https://github.com/HenriqueGuilhermeUx/docwallet/actions/runs/44167336093), incluindo verificação anti-token em URL.
- iOS unsigned anterior: [run #44156811033](https://github.com/HenriqueGuilhermeUx/docwallet/actions/runs/44156811033), iPhone/iPad com screenshots; evidência nativa mais recente deve ser verificada à parte.
