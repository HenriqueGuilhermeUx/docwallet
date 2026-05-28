-- ================================================
-- SQL 03: LOGS DE COMPARTILHAMENTO
-- DocWallet - Executar TERCEIRO
-- ================================================

-- 1. Criar tabela de DOCUMENTOS COMPARTILHADOS (se não existir)
-- Esta tabela pode já existir, então vamos adicionar colunas que faltam
DO $$
BEGIN
  -- Criar tabela se não existir
  CREATE TABLE IF NOT EXISTS public.shared_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Adicionar colunas novas (se não existirem)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'shared_documents' AND column_name = 'created_by') THEN
    ALTER TABLE public.shared_documents ADD COLUMN created_by UUID NOT NULL DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'shared_documents' AND column_name = 'access_count') THEN
    ALTER TABLE public.shared_documents ADD COLUMN access_count INTEGER DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'shared_documents' AND column_name = 'is_revoked') THEN
    ALTER TABLE public.shared_documents ADD COLUMN is_revoked BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
END $$;

-- 2. Criar tabela de LOGS DE ACESSO (se não existir)
CREATE TABLE IF NOT EXISTS public.share_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID REFERENCES public.shared_documents(id) ON DELETE CASCADE NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- 3. Criar índice
CREATE INDEX IF NOT EXISTS idx_share_access_logs_share_id ON public.share_access_logs(share_id);
CREATE INDEX IF NOT EXISTS idx_shared_documents_document_id ON public.shared_documents(document_id);

-- 4. Habilitar RLS na tabela de logs
ALTER TABLE public.share_access_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies para Shared Documents
DROP POLICY IF EXISTS "Anyone can view shared documents" ON public.shared_documents;
DROP POLICY IF EXISTS "Users can create shared links for own documents" ON public.shared_documents;
CREATE POLICY "Anyone can view shared documents" ON public.shared_documents
  FOR SELECT USING (TRUE);
CREATE POLICY "Users can create shared links for own documents" ON public.shared_documents
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 6. Policies para Share Access Logs
DROP POLICY IF EXISTS "Anyone can view access logs" ON public.share_access_logs;
DROP POLICY IF EXISTS "Service can insert access logs" ON public.share_access_logs;
CREATE POLICY "Anyone can view access logs" ON public.share_access_logs
  FOR SELECT USING (TRUE);
CREATE POLICY "Service can insert access logs" ON public.share_access_logs
  FOR INSERT WITH CHECK (TRUE);

-- 7. Função segura para buscar documento compartilhado
DROP FUNCTION IF EXISTS public.get_shared_document_safe(UUID);
CREATE OR REPLACE FUNCTION public.get_shared_document_safe(p_share_id UUID)
RETURNS public.documents AS $$
DECLARE
  v_doc public.documents;
  v_expires_at TIMESTAMPTZ;
  v_is_revoked BOOLEAN;
BEGIN
  -- Buscar informações do link
  SELECT expires_at, is_revoked INTO v_expires_at, v_is_revoked
  FROM public.shared_documents
  WHERE id = p_share_id;

  -- Verificar se link existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link não encontrado';
  END IF;

  -- Verificar se foi revogado
  IF v_is_revoked THEN
    RAISE EXCEPTION 'Link revogado';
  END IF;

  -- Verificar se expirou
  IF v_expires_at < NOW() THEN
    RAISE EXCEPTION 'Link expirado';
  END IF;

  -- Incrementar contador de acessos
  UPDATE public.shared_documents
  SET access_count = access_count + 1
  WHERE id = p_share_id;

  -- Logar acesso
  INSERT INTO public.share_access_logs (share_id, ip_address, user_agent)
  VALUES (p_share_id, NULL, NULL);

  -- Buscar e retornar documento
  SELECT d.* INTO v_doc
  FROM public.documents d
  INNER JOIN public.shared_documents s ON s.document_id = d.id
  WHERE s.id = p_share_id;

  RETURN v_doc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- PRONTO! Execute este SQL terceiro
-- ================================================