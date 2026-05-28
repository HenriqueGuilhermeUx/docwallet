# DocWallet - Guia de Implantação Completo

## Visão Geral do Produto
DocWallet é uma carteira digital de documentos que permite:
- **Armazenar** documentos (RG, CNH, CPF, carteiras profissionais, etc.)
- **Compartilhar** via QR Code, link, WhatsApp e e-mail
- **Autenticar** documentos na blockchain Polygon
- **Criar** contratos inteligentes
- **Gerenciar** identidade descentralizada (DID/VC/ZKP)

---

## 1. CONFIGURAÇÃO DO SUPABASE (OBRIGATÓRIO)

### 1.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em "New Project"
3. Preencha:
   - **Name**: DocWallet
   - **Database Password**: Guarde esta senha!
   - **Region**: Escolha a mais próxima (São Paulo)
4. Aguarde a criação do projeto (2-3 minutos)

### 1.2 Obter Credenciais
1. Vá em **Settings > API**
2. Copie o **Project URL** (formato: `https://xxxxx.supabase.co`)
3. Copie o **anon/public** key (JWT)
4. Clique em **Service role** para gerar a chave de serviço (para backend)

### 1.3 Executar Schema no Supabase
1. Vá em **SQL Editor**
2. Cole o conteúdo de `supabase_schema.sql` (no repositório)
3. Clique em **Run** para criar todas as tabelas

### 1.4 Configurar Variáveis de Ambiente
1. No Supabase Dashboard, vá em **Settings > Authentication > URL Configuration**
2. Configure o **Site URL**: `https://seu-dominio.netlify.app`
3. Configure **Redirect URLs**: `https://seu-dominio.netlify.app/*`

---

## 2. CONFIGURAÇÃO DO NETLIFY

### 2.1 Conectar GitHub
1. Acesse [netlify.com](https://netlify.com)
2. Clique em "Add new site > Import an existing project"
3. Selecione seu repositório GitHub
4. Configure:
   - **Build command**: `pnpm install && pnpm run build`
   - **Publish directory**: `dist`

### 2.2 Configurar Variáveis de Ambiente no Netlify
Vá em **Site settings > Environment variables** e adicione:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
VITE_ALCHEMY_API_KEY=sua-chave-alchemy
VITE_ALCHEMY_URL=https://polygon-mainnet.g.alchemy.com/v2/sua-chave
```

### 2.3 Configurar Redirects
O `netlify.toml` já está configurado com SPA fallback.

---

## 3. CONFIGURAÇÃO DA BLOCKCHAIN (POLYGON)

### 3.1 Criar Conta na Alchemy
1. Acesse [alchemy.com](https://alchemy.com)
2. Crie uma conta gratuita
3. Crie um novo App:
   - **Name**: DocWallet
   - **Chain**: Polygon
   - **Network**: Mainnet (ou Mumbai para teste)
4. Copie a **API Key** e **JSON RPC URL**

### 3.2 Configurar Carteira Admin
O projeto usa uma carteira admin para pagar gas nas transações. Configure no `.env`:
```
ADMIN_WALLET_ADDRESS=0x... (endereço da carteira)
PRIVATE_KEY=0x... (chave privada - MANTENHA SEGURA!)
```

⚠️ **IMPORTANTE**: Nunca comite a PRIVATE_KEY no GitHub!

---

## 4. CONFIGURAÇÃO DO MERCADO PAGO (PAGAMENTOS)

### 4.1 Criar Conta Mercado Pago
1. Acesse [developers.mercadopago.com](https://developers.mercadopago.com)
2. Crie uma aplicação
3. Configure as credenciais:
   - **Access Token** (produção)
   - **Public Key** (frontend)

### 4.2 Configurar Webhook
1. Nas configurações da aplicação, configure a URL do webhook
2. O webhook deve receber eventos de `payment`
3. Implemente a validação da assinatura do Mercado Pago no backend

---

## 5. CONFIGURAÇÃO DO DIDIT (IDENTIDADE)

### 5.1 Criar Conta Didit
1. Acesse o painel do Didit
2. Crie um projeto para DocWallet
3. Obtenha a API Key para KYC/Identidade

---

## 6. PASSOS PARA DEPLOY

### 6.1 Preparar Repositório
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/docwallet.git
cd docwallet

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Teste localmente
pnpm dev
```

### 6.2 Deploy no Netlify
1. Push para GitHub
2. Netlify detectará automaticamente o deploy
3. Aguarde o build (2-3 minutos)
4. Configure domínio customizado (opcional)

### 6.3 Testar Funcionalidades
- [ ] Cadastro/Login de usuários
- [ ] Upload de documentos
- [ ] Visualização de documentos
- [ ] Exclusão de documentos
- [ ] Compartilhamento via link
- [ ] Autenticação blockchain
- [ ] Compra de créditos via PIX

---

## 7. MELHORES PRÁTICAS DE PRODUÇÃO

### Segurança
1. **Nunca exponha** `SUPABASE_SERVICE_ROLE_KEY` no frontend
2. **Use HTTPS** em todas as requisições
3. **Valide** todas as entradas no frontend e backend
4. **Implemente** rate limiting para APIs

### Performance
1. Habilite CDN no Netlify
2. Configure cache headers apropriados
3. Use code splitting para bundles grandes
4. Otimize imagens antes do upload

### Monitoramento
1. Configure logs de erro (Sentry)
2. Monitore performance (Analytics)
3. Configure alertas para falhas

---

## 8. RESOLUÇÃO DE PROBLEMAS

### Build Falha
1. Verifique se todas as variáveis de ambiente estão configuradas
2. Limpe o cache: `rm -rf node_modules && pnpm install`

### Erro de Autenticação
1. Verifique se as URLs do Supabase estão corretas
2. Confirme que o Site URL está configurado no Supabase

### Erro de Storage
1. Verifique se o bucket "documents" foi criado
2. Confirme as políticas RLS do Storage

---

## 9. CONTATO E SUPORTE

Para dúvidas técnicas, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.