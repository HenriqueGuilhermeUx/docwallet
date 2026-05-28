-- ================================================
-- DocWallet - SQL de MIGRAÇÃO
-- Adiciona campos novos ao schema existente
-- Execute APENAS se as tabelas já existem
-- ================================================

-- 1. Adicionar campos na tabela shared_documents (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_documents' AND column_name = 'created_by') THEN
    ALTER TABLE public.shared_documents ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_documents' AND column_name = 'access_count') THEN
    ALTER TABLE public.shared_documents ADD COLUMN access_count INTEGER DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_documents' AND column_name = 'is_revoked') THEN
    ALTER TABLE public.shared_documents ADD COLUMN is_revoked BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
END $$;

-- 2. Criar tabela de logs de acesso (se não existir)
CREATE TABLE IF NOT EXISTS public.share_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID REFERENCES public.shared_documents(id) ON DELETE CASCADE NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_share_access_logs_share_id ON public.share_access_logs(share_id);

-- 3. Criar função segura para buscar documento compartilhado (se não existir)
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

-- 4. Atualizar RLS para shared_documents (corrigir)
DROP POLICY IF EXISTS "Anyone can view shared documents" ON public.shared_documents;
CREATE POLICY "Anyone can view shared documents" ON public.shared_documents
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create shared links for own documents" ON public.shared_documents;
CREATE POLICY "Users can create shared links for own documents" ON public.shared_documents
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 5. Criar função para atualizar credits (se não existir)
CREATE OR REPLACE FUNCTION public.update_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Atualizar ou inserir créditos
  INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Aplicar transação
  UPDATE public.user_credits
  SET
    balance = CASE
      WHEN p_type IN ('purchase', 'refund', 'bonus') THEN balance + p_amount
      WHEN p_type = 'use' THEN balance - p_amount
      ELSE balance
    END,
    total_purchased = CASE WHEN p_type = 'purchase' THEN total_purchased + p_amount ELSE total_purchased END,
    total_used = CASE WHEN p_type = 'use' THEN total_used + ABS(p_amount) ELSE total_used END,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Registrar no histórico
  INSERT INTO public.credits_history (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, COALESCE(p_description, p_type));

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar função para verificar créditos suficientes (se não existir)
CREATE OR REPLACE FUNCTION public.has_sufficient_credits(p_user_id UUID, p_required INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM public.user_credits
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_balance, 0) >= p_required;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atualizar função de novo usuário para incluir created_by
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
  VALUES (NEW.id, 5, 5, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Policy para share_access_logs
ALTER TABLE public.share_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view access logs" ON public.share_access_logs;
CREATE POLICY "Anyone can view access logs" ON public.share_access_logs
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Service can insert access logs" ON public.share_access_logs;
CREATE POLICY "Service can insert access logs" ON public.share_access_logs
  FOR INSERT WITH CHECK (TRUE);

-- ================================================
-- FIM DO SQL DE MIGRAÇÃO
-- ================================================