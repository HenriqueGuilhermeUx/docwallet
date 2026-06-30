-- =============================================================
-- DocWallet Phase 1 - Compartilhamento seguro
-- Execute no SQL Editor do Supabase do projeto DocWallet.
-- Este arquivo é incremental: pode rodar mesmo se as tabelas já existirem.
-- =============================================================

-- 1) Fortalecer tabela de links compartilhados
ALTER TABLE public.shared_documents
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_views INTEGER,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"view": true, "download": true}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_shared_documents_expires_at
  ON public.shared_documents(expires_at);

CREATE INDEX IF NOT EXISTS idx_shared_documents_created_by
  ON public.shared_documents(created_by);

-- 2) Função pública segura para abrir documento compartilhado sem expor todos os documentos
CREATE OR REPLACE FUNCTION public.get_shared_document_safe(p_share_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  category TEXT,
  file_url TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shared public.shared_documents%ROWTYPE;
BEGIN
  SELECT *
  INTO v_shared
  FROM public.shared_documents sd
  WHERE sd.id = p_share_id
    AND sd.expires_at > NOW()
    AND COALESCE(sd.is_revoked, FALSE) = FALSE
    AND (
      sd.max_views IS NULL
      OR COALESCE(sd.view_count, 0) < sd.max_views
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link inválido, expirado ou revogado';
  END IF;

  UPDATE public.shared_documents
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_share_id;

  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.type,
    d.category,
    d.file_url,
    d.file_path,
    d.file_type,
    d.file_size,
    d.created_at,
    d.updated_at,
    v_shared.expires_at,
    COALESCE(v_shared.permissions, '{"view": true, "download": true}'::jsonb)
  FROM public.documents d
  WHERE d.id = v_shared.document_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_document_safe(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_document_safe(UUID) TO authenticated;

-- 3) Política de leitura dos links permanece pública apenas na tabela de links;
-- a função acima controla a liberação do documento relacionado.
DROP POLICY IF EXISTS "Anyone can view shared documents" ON public.shared_documents;
CREATE POLICY "Anyone can view shared documents" ON public.shared_documents
  FOR SELECT USING (TRUE);

-- 4) Política de criação para usuário Supabase autenticado.
-- Observação: login Nexa puro deve futuramente criar links via backend Nexa/DocWallet API
-- usando service role, porque o browser não deve carregar service role.
DROP POLICY IF EXISTS "Users can create shared links for own documents" ON public.shared_documents;
CREATE POLICY "Users can create shared links for own documents" ON public.shared_documents
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id)
  );
