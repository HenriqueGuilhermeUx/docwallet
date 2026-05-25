-- ================================================
-- DocWallet - SQL para criar estrutura no Supabase
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- 1. Criar tabela de perfis de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela de documentos
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela de links compartilhados
CREATE TABLE IF NOT EXISTS public.shared_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela de CREDITOS dos usuarios
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0 NOT NULL,
  total_purchased INTEGER DEFAULT 0 NOT NULL,
  total_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar tabela de HISTORICO DE CREDITOS
CREATE TABLE IF NOT EXISTS public.credits_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund', 'bonus')),
  description TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar tabela de DOCUMENTOS AUTENTICADOS (Blockchain)
CREATE TABLE IF NOT EXISTS public.blockchain_notarizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number BIGINT,
  network TEXT DEFAULT 'polygon' NOT NULL,
  credits_used INTEGER DEFAULT 1 NOT NULL,
  status TEXT DEFAULT 'confirmed' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Criar tabela de CONTRATOS BLOCKCHAIN
CREATE TABLE IF NOT EXISTS public.blockchain_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_type TEXT NOT NULL,
  party1_name TEXT NOT NULL,
  party2_name TEXT NOT NULL,
  object_description TEXT,
  value TEXT,
  validity_date DATE,
  tx_hash TEXT NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Criar indices para performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_documents_document_id ON public.shared_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_history_user_id ON public.credits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_notarizations_user_id ON public.blockchain_notarizations(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_contracts_user_id ON public.blockchain_contracts(user_id);

-- 9. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_notarizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_contracts ENABLE ROW LEVEL SECURITY;

-- 10. Criar politicas RLS

-- Profiles: usuario ve/edita seu proprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Documents: usuario ve/gerencia seus proprios documentos
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Shared documents: qualquer um pode ver (para links compartilhados)
CREATE POLICY "Anyone can view shared documents" ON public.shared_documents
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can create shared links for own documents" ON public.shared_documents
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id)
  );

-- User Credits: usuario ve/edita seus proprios creditos
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service can insert credits" ON public.user_credits
  FOR INSERT WITH CHECK (TRUE);

-- Credits History: usuario ve seu historico
CREATE POLICY "Users can view own credits history" ON public.credits_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert credits history" ON public.credits_history
  FOR INSERT WITH CHECK (TRUE);

-- Blockchain Notarizations: usuario ve suas autenticacoes
CREATE POLICY "Users can view own notarizations" ON public.blockchain_notarizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notarizations" ON public.blockchain_notarizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blockchain Contracts: usuario ve/cria seus contratos
CREATE POLICY "Users can view own contracts" ON public.blockchain_contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts" ON public.blockchain_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Criar funcao para criar perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  -- Criar creditos iniciais para novo usuario
  INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Gatilho para criar perfil ao cadastrar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Storage Bucket para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 14. Policies para Storage
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================
-- Creditos iniciais para usuarios existentes
-- Execute para dar creditos a usuarios ja cadastrados
-- ================================================
-- INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
-- SELECT id, 5, 5, 0 FROM auth.users
-- WHERE NOT EXISTS (SELECT 1 FROM public.user_credits WHERE user_credits.user_id = auth.users.id);
