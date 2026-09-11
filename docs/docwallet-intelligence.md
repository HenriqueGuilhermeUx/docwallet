# DocWallet Intelligence

## Tese

O DocWallet evolui de cofre de documentos para plataforma de **Document Intelligence + Digital Trust**.

> Seu documento não fica apenas guardado. O DocWallet entende o que existe dentro dele.

## Fluxo

DOCUMENTO → upload → extração → classificação → dados estruturados → prazos / partes / valores / obrigações → assinaturas → audit trail → hash / prova de integridade → alertas / busca.

## Segurança e LGPD

- A feature usa isolamento por `user_id` em todos os endpoints.
- O documento original não é alterado pela extração.
- Logs e métricas não recebem conteúdo documental, nomes de partes, CPF/CNPJ ou texto bruto.
- Provider externo fica desativado por padrão (`DOCUMENT_INTELLIGENCE_ALLOW_EXTERNAL=false`).
- A saída é apoio informacional e exige revisão humana quando necessário.

## Providers

- `internal`: parser determinístico interno com heurísticas de contrato, datas, valores, partes e riscos.
- `mock`: compatível para testes.
- `docstruct`: adapter reservado; por padrão faz fallback interno sem envio externo.

## Endpoints

- `POST /api/documents/:id/analyze`
- `GET /api/documents/:id/intelligence`
- `PATCH /api/documents/:id/intelligence`
- `GET /api/documents/:id/alerts`
- `POST /api/documents/:id/signature-request`
- `GET /api/documents/:id/audit-trail`
- `GET /api/documents/search?q=...`
- `GET /api/contracts/upcoming-expirations?days=60`
- `GET /api/intelligence/dashboard`
- `GET /api/intelligence/metrics`

## Tabelas

- `document_intelligence`
- `document_party`
- `document_date`
- `document_amount`
- `document_obligation`
- `document_alert`
- `document_version`
- `audit_event`
- `usage_metric`

As tabelas existentes de assinatura (`signature_requests`, `signature_parties`, `signature_events`) continuam sendo reutilizadas.

## Variáveis

```env
DOCUMENT_INTELLIGENCE_ENABLED=true
DOCUMENT_INTELLIGENCE_PROVIDER=internal
DOCUMENT_INTELLIGENCE_STORE_RAW_TEXT=true
DOCUMENT_INTELLIGENCE_ALLOW_EXTERNAL=false
```

## Limitações atuais

- PDF textual é extraído com `pypdf`; PDF escaneado/imagem ainda precisa de OCR em etapa futura.
- Não há interpretação jurídica definitiva.
- Campos arrastáveis em PDF ficam para o próximo ciclo visual da assinatura.
