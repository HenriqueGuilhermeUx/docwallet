# DocWallet - Checklist de Implantação

## ✅ PASSO 1: Configurar Supabase
1. Criar projeto em [supabase.com](https://supabase.com)
2. Copiar **Project URL** e **Anon Key**
3. Executar `supabase_schema.sql` no SQL Editor
4. Configurar Authentication > URL > Site URL

## ✅ PASSO 2: Atualizar .env
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_ALCHEMY_API_KEY=sua-chave-alchemy
```

## ✅ PASSO 3: Deploy no Netlify
1. Conectar repositório GitHub
2. Build command: `pnpm install && pnpm run build`
3. Publish directory: `dist`
4. Adicionar variáveis de ambiente

## ✅ PASSO 4: Testar
- [ ] Cadastro/Login
- [ ] Upload de documentos
- [ ] Compartilhamento
- [ ] Autenticação blockchain

## ⚠️ ALERTA DE SEGURANÇA
**NUNCA** commite o arquivo `.env` no GitHub!
Adicione ao `.gitignore`:
```
.env
.env.local
```

## 🔧 Comando Rápido para Deploy
```bash
cd docwallet
git add -A
git commit -m "deploy"
git push
```

O Netlify hará rebuild automático em ~2-3 minutos.