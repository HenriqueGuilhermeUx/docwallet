# DocWallet - Carteira Digital de Documentos

**Sua carteira digital para armazenar e compartilhar documentos de forma segura com autenticação blockchain.**

## Funcionalidades

### Documentos
- [x] Armazenar documentos (RG, CNH, CPF, Passaporte, Carteiras Profissionais)
- [x] Upload de imagens e PDFs
- [x] Categorização automática
- [x] Busca por nome

### Compartilhamento
- [x] QR Code para compartilhamento rápido
- [x] Link temporário (válido 7 dias)
- [x] Compartilhar via WhatsApp
- [x] Compartilhar via E-mail

### Blockchain (Polygon)
- [x] Autenticar documentos na blockchain
- [x] Criar contratos inteligentes
- [x] Sistema de créditos para transações
- [x] Histórico de operações

### Identidade (DID/VC/ZKP)
- [x] Identidades descentralizadas
- [x] Credenciais verificáveis (W3C VC)
- [x] Provas de conhecimento zero
- [x] KYC integrado

## Tech Stack

| Tecnologia | Uso |
|------------|-----|
| React + TypeScript + Vite | Frontend |
| Tailwind CSS | Estilização |
| Supabase | Auth + Database + Storage |
| Polygon + Alchemy | Blockchain |
| Mercado Pago | Pagamentos PIX |

## Configuração

### 1. Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# Blockchain (Polygon)
VITE_ALCHEMY_API_KEY=sua-chave-alchemy
VITE_ALCHEMY_URL=https://polygon-mainnet.g.alchemy.com/v2/sua-chave

# Wallet Admin
VITE_ADMIN_WALLET_ADDRESS=0x...

# Mercado Pago
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
```

### 2. Supabase Setup

Execute o arquivo `supabase_schema.sql` no SQL Editor do Supabase para criar:
- Tabela de documentos
- Tabela de créditos
- Tabela de autenticações blockchain
- Storage bucket
- Políticas RLS de segurança

### 3. Deploy

```bash
# Instalar dependências
pnpm install

# Build para produção
pnpm run build

# Deploy (Netlify/Vercel)
```

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Build para produção
pnpm run build
```

## Segurança

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env` no GitHub!

- use `.env.example` como template
- Mantenha `SUPABASE_SERVICE_ROLE_KEY` apenas no backend
- Use Signed URLs para documentos sensíveis

## Documentação Adicional

- [Guia de Deploy Completo](./DEPLOY_COMPLETE.md)
- [Quick Start](./QUICK_START.md)
- [Relatório de Análise](./RELATORIO_ANALISE.md)

## Licença

MIT