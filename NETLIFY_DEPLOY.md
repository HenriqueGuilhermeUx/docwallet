# DocWallet - Deploy no Netlify

## 📦 Arquivo para Upload

Baixe o arquivo: <filepath>/workspace/docwallet/docwallet_netlify.zip</filepath>

## 🚀 Deploy Rápido (2 métodos)

### Método 1: Drag & Drop (Mais Fácil)
1. Acesse https://app.netlify.com/drop
2. Arraste o arquivo `.zip` extraído
3. Pronto! Seu site estará online

### Método 2: Via GitHub (Recomendado para atualizações)
1. Crie um repositório no GitHub
2. Faça upload dos arquivos (sem `node_modules`)
3. Conecte ao Netlify
4. Configure as variáveis de ambiente

## ⚙️ Variáveis de Ambiente (Obrigatório)

No Netlify, vá em **Site Settings > Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://myjzilyiytrcndyyxwxj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15anppbHlpeXRyY25keXl4d3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTcxNTEsImV4cCI6MjA5NTAzMzE1MX0._tM_eBzT98CUOV8UVAKBNn-6crMTGqDNuOkB7ZsOi1A` |

## 📁 Estrutura do Projeto

```
docwallet/
├── netlify.toml          # Configuração do Netlify
├── .env                  # Variáveis de ambiente
├── src/
│   ├── components/       # Componentes React
│   ├── hooks/            # Hooks personalizados
│   ├── lib/              # Supabase client
│   └── App.tsx           # Componente principal
├── package.json
└── vite.config.ts
```

## ✅ Checklist Antes de Publicar

- [x] Banco de dados Supabase configurado
- [x] Tabelas criadas (profiles, documents, shared_documents)
- [x] Storage bucket "documents" configurado
- [x] RLS e políticas de segurança ativas
- [x] Variáveis de ambiente configuradas no Netlify

## 🎉 Pronto!

Seu DocWallet estará funcionando com:
- ✅ Cadastro/Login de usuários
- ✅ Upload de documentos
- ✅ Compartilhamento via QR Code, WhatsApp, Email
- ✅ Acesso multi-dispositivo

## 🔧 Troubleshooting

**Erro 401 ou 403:**
- Verifique se as RLS policies foram criadas corretamente
- Confirme as variáveis de ambiente

**Erro de upload:**
- Verifique se o bucket "documents" foi criado no Supabase
- Confirme as policies de storage

**Imagens não carregam:**
- Verifique se o bucket está como "Public" no Supabase
- Check: Supabase > Storage > buckets > documents > permissions