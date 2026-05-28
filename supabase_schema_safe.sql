-- ================================================
-- DocWallet - SQL Modular para Supabase
-- Execute em partes se necessário
-- ================================================

-- ================================================
-- PARTE 1: Criar tabelas básicas (sem dependências)
-- ================================================

-- 1.1 Perfil de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Créditos dos usuários
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0 NOT NULL,
  total_purchased INTEGER DEFAULT 0 NOT NULL,
  total_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Histórico de créditos
CREATE TABLE IF NOT EXISTS public.credits_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund', 'bonus')),
  description TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PARTE 2: Criar tabelas de documentos
-- ================================================

-- 2.1 Documentos
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

-- 2.2 Links compartilhados
CREATE TABLE IF NOT EXISTS public.shared_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PARTE 3: Criar tabelas de blockchain
-- ================================================

-- 3.1 Documentos autenticados na blockchain
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

-- 3.2 Contratos blockchain
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

-- ================================================
-- PARTE 4: Criar índices para performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_documents_document_id ON public.shared_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_history_user_id ON public.credits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_notarizations_user_id ON public.blockchain_notarizations(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_contracts_user_id ON public.blockchain_contracts(user_id);

-- ================================================
-- PARTE 5: Habilitar RLS
-- ================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_notarizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_contracts ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PARTE 6: Políticas RLS
-- ================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Shared documents (público para links compartilhados)
DROP POLICY IF EXISTS "Anyone can view shared documents" ON public.shared_documents;
CREATE POLICY "Anyone can view shared documents" ON public.shared_documents
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create shared links for own documents" ON public.shared_documents;
CREATE POLICY "Users can create shared links for own documents" ON public.shared_documents
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id)
  );

-- User Credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Credits History
DROP POLICY IF EXISTS "Users can view own credits history" ON public.credits_history;
CREATE POLICY "Users can view own credits history" ON public.credits_history
  FOR SELECT USING (auth.uid() = user_id);

-- Blockchain Notarizations
DROP POLICY IF EXISTS "Users can view own notarizations" ON public.blockchain_notarizations;
CREATE POLICY "Users can view own notarizations" ON public.blockchain_notarizations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notarizations" ON public.blockchain_notarizations;
CREATE POLICY "Users can insert own notarizations" ON public.blockchain_notarizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blockchain Contracts
DROP POLICY IF EXISTS "Users can view own contracts" ON public.blockchain_contracts;
CREATE POLICY "Users can view own contracts" ON public.blockchain_contracts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own contracts" ON public.blockchain_contracts;
CREATE POLICY "Users can insert own contracts" ON public.blockchain_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================
-- PARTE 7: Função para criar perfil automaticamente
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- PARTE 8: Storage Bucket
-- ================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
CREATE POLICY "Anyone can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================
-- FIM - Mensagem de sucesso
-- ================================================
-- Execute: SELECT 'DocWallet schema created successfully!' as status;