-- ================================================
-- SQL 02: TABELAS DE CRÉDITOS E BLOCKCHAIN
-- DocWallet - Executar SEGUNDO
-- ================================================

-- 1. Criar tabela de CREDITOS (se não existir)
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0 NOT NULL,
  total_purchased INTEGER DEFAULT 0 NOT NULL,
  total_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela de HISTORICO DE CREDITOS (se não existir)
CREATE TABLE IF NOT EXISTS public.credits_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund', 'bonus')),
  description TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela de DOCUMENTOS AUTENTICADOS (Blockchain) (se não existir)
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

-- 4. Criar tabela de CONTRATOS BLOCKCHAIN (se não existir)
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

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_history_user_id ON public.credits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_notarizations_user_id ON public.blockchain_notarizations(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_contracts_user_id ON public.blockchain_contracts(user_id);

-- 6. Habilitar RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_notarizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_contracts ENABLE ROW LEVEL SECURITY;

-- 7. Policies para User Credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Service can insert credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can insert credits" ON public.user_credits
  FOR INSERT WITH CHECK (TRUE);

-- 8. Policies para Credits History
DROP POLICY IF EXISTS "Users can view own credits history" ON public.credits_history;
DROP POLICY IF EXISTS "Service can insert credits history" ON public.credits_history;
CREATE POLICY "Users can view own credits history" ON public.credits_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert credits history" ON public.credits_history
  FOR INSERT WITH CHECK (TRUE);

-- 9. Policies para Blockchain Notarizations
DROP POLICY IF EXISTS "Users can view own notarizations" ON public.blockchain_notarizations;
DROP POLICY IF EXISTS "Users can insert own notarizations" ON public.blockchain_notarizations;
CREATE POLICY "Users can view own notarizations" ON public.blockchain_notarizations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notarizations" ON public.blockchain_notarizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Policies para Blockchain Contracts
DROP POLICY IF EXISTS "Users can view own contracts" ON public.blockchain_contracts;
DROP POLICY IF EXISTS "Users can insert own contracts" ON public.blockchain_contracts;
CREATE POLICY "Users can view own contracts" ON public.blockchain_contracts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contracts" ON public.blockchain_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Função para atualizar créditos (remover antes se existir)
DROP FUNCTION IF EXISTS public.update_user_credits(UUID, INTEGER, TEXT, TEXT);
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
  INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

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

  INSERT INTO public.credits_history (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, COALESCE(p_description, p_type));

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para verificar créditos suficientes
DROP FUNCTION IF EXISTS public.has_sufficient_credits(UUID, INTEGER);
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

-- ================================================
-- PRONTO! Execute este SQL segundo
-- ================================================