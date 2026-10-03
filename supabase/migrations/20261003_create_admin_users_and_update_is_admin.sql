-- Migração: Tabela admin_users e atualização de is_admin()
-- Projeto: NegóMapa
-- Data: 2026-10-03

-- ============================================================================
-- TABELA admin_users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- RLS EM admin_users
-- ============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Política SELECT: utilizador autenticado lê apenas o seu próprio registo
DROP POLICY IF EXISTS "admin_users_select_own" ON public.admin_users;
CREATE POLICY "admin_users_select_own" ON public.admin_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- SUBSTITUIR FUNÇÃO is_admin()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- ============================================================================
-- INSERIR ADMIN INICIAL (se existir em auth.users)
-- ============================================================================

INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users
WHERE email = 'negomapaangola@gmail.com'
ON CONFLICT (user_id) DO NOTHING;