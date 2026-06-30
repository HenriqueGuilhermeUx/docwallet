-- =============================================================
-- DocWallet Standalone - Storage seguro + validação real blockchain
-- Execute no SQL Editor do Supabase do projeto DocWallet.
-- Seguro para rodar mais de uma vez.
-- =============================================================

-- 1) Extensões úteis
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Reforço da tabela de documentos
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_notarized BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS certificate_id TEXT,
  ADD COLUMN IF NOT EXISTS notarized_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON public.documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_is_notarized ON public.documents(is_notarized);

-- 3) Certificados blockchain reais
CREATE TABLE IF NOT EXISTS public.document_notarizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  certificate_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  network_name TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT,
  explorer_url TEXT,
  price_paid TEXT,
  currency TEXT,
  status TEXT DEFAULT 'confirmed' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_notarizations_user_id ON public.document_notarizations(user_id);
CREATE INDEX IF NOT EXISTS idx_document_notarizations_file_hash ON public.document_notarizations(file_hash);
CREATE INDEX IF NOT EXISTS idx_document_notarizations_tx_hash ON public.document_notarizations(tx_hash);

ALTER TABLE public.document_notarizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own document notarizations" ON public.document_notarizations;
CREATE POLICY "Users can view own document notarizations" ON public.document_notarizations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own document notarizations" ON public.document_notarizations;
CREATE POLICY "Users can insert own document notarizations" ON public.document_notarizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Consulta pública mínima por hash para tela de verificação.
-- Não expõe arquivo, apenas dados do certificado.
DROP POLICY IF EXISTS "Anyone can verify notarization by hash" ON public.document_notarizations;
CREATE POLICY "Anyone can verify notarization by hash" ON public.document_notarizations
  FOR SELECT USING (status = 'confirmed');

-- 4) Compartilhamento seguro
ALTER TABLE public.shared_documents
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_views INTEGER,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"view": true, "download": true}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_shared_documents_created_by ON public.shared_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_documents_expires_at ON public.shared_documents(expires_at);

DROP POLICY IF EXISTS "Users can create shared links for own documents" ON public.shared_documents;
CREATE POLICY "Users can create shared links for own documents" ON public.shared_documents
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id)
  );

DROP POLICY IF EXISTS "Anyone can view shared documents" ON public.shared_documents;
CREATE POLICY "Anyone can view shared documents" ON public.shared_documents
  FOR SELECT USING (TRUE);

-- 5) Storage privado para documentos pessoais
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6) Função para verificar certificado por hash sem expor documento privado
CREATE OR REPLACE FUNCTION public.verify_document_hash(p_file_hash TEXT)
RETURNS TABLE (
  certificate_id TEXT,
  document_name TEXT,
  file_hash TEXT,
  wallet_address TEXT,
  chain_id INTEGER,
  network_name TEXT,
  tx_hash TEXT,
  block_number BIGINT,
  explorer_url TEXT,
  created_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dn.certificate_id,
    dn.document_name,
    dn.file_hash,
    dn.wallet_address,
    dn.chain_id,
    dn.network_name,
    dn.tx_hash,
    dn.block_number,
    dn.explorer_url,
    dn.created_at,
    dn.status
  FROM public.document_notarizations dn
  WHERE dn.file_hash = lower(regexp_replace(p_file_hash, '^0x', '', 'i'))
    AND dn.status = 'confirmed'
  ORDER BY dn.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_document_hash(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_document_hash(TEXT) TO authenticated;
