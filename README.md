# DocWallet - Carteira Digital de Documentos

Sua carteira digital para armazenar e compartilhar documentos de forma segura.

## Funcionalidades

- Armazenar documentos (RG, CNH, CPF, Carteiras Profissionais)
- Compartilhar via email, WhatsApp e QR Code
- Autenticação blockchain (Polygon)
- Contratos inteligentes
- Sistema de créditos para transações

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Auth + Database + Storage)
- Polygon Blockchain (Alchemy API)
- Mercado Pago (PIX)

## Variaveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_ADMIN_WALLET_ADDRESS=your_wallet_address
```

## Deploy no Netlify

1. Conecte o repositório GitHub ao Netlify
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## SQL

Execute o arquivo `supabase_schema.sql` no Supabase para criar as tabelas necessárias.