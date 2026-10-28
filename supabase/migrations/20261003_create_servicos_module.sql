-- Migração: Módulo de Serviços (profissionais, categorias, servicos)
-- Projeto: NegóMapa
-- Data: 2026-10-03

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para verificar se o utilizador é admin (baseado na tabela admin_users)
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

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TABELAS
-- ============================================================================

-- Tabela: profissionais
CREATE TABLE IF NOT EXISTS public.profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  telefone text,
  whatsapp text,
  bio text,
  provincia text,
  municipio text,
  estado text NOT NULL CHECK (estado IN ('pendente', 'aprovado', 'suspenso')) DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela: servicos
CREATE TABLE IF NOT EXISTS public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
  titulo text NOT NULL,
  slug text UNIQUE NOT NULL,
  descricao text,
  preco numeric,
  preco_tipo text,
  whatsapp text,
  provincia text,
  municipio text,
  estado text NOT NULL CHECK (estado IN ('pendente', 'aprovado', 'rejeitado', 'suspenso')) DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- profissionais
CREATE INDEX IF NOT EXISTS idx_profissionais_slug ON public.profissionais(slug);
CREATE INDEX IF NOT EXISTS idx_profissionais_estado ON public.profissionais(estado);
CREATE INDEX IF NOT EXISTS idx_profissionais_provincia ON public.profissionais(provincia);
CREATE INDEX IF NOT EXISTS idx_profissionais_municipio ON public.profissionais(municipio);
CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON public.profissionais(user_id);

-- categorias
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON public.categorias(slug);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON public.categorias(ativo);

-- servicos
CREATE INDEX IF NOT EXISTS idx_servicos_slug ON public.servicos(slug);
CREATE INDEX IF NOT EXISTS idx_servicos_estado ON public.servicos(estado);
CREATE INDEX IF NOT EXISTS idx_servicos_categoria_id ON public.servicos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_servicos_profissional_id ON public.servicos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_servicos_provincia ON public.servicos(provincia);
CREATE INDEX IF NOT EXISTS idx_servicos_municipio ON public.servicos(municipio);

-- ============================================================================
-- TRIGGERS PARA updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_profissionais_updated_at ON public.profissionais;
CREATE TRIGGER trigger_profissionais_updated_at
  BEFORE UPDATE ON public.profissionais
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_servicos_updated_at ON public.servicos;
CREATE TRIGGER trigger_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS: CATEGORIAS
-- ============================================================================

-- Anónimos: ler apenas categorias ativas
DROP POLICY IF EXISTS "categorias_select_anon" ON public.categorias;
CREATE POLICY "categorias_select_anon" ON public.categorias
  FOR SELECT TO anon
  USING (ativo = true);

-- Autenticados: ler categorias ativas
DROP POLICY IF EXISTS "categorias_select_auth" ON public.categorias;
CREATE POLICY "categorias_select_auth" ON public.categorias
  FOR SELECT TO authenticated
  USING (ativo = true);

-- Admin: acesso total
DROP POLICY IF EXISTS "categorias_all_admin" ON public.categorias;
CREATE POLICY "categorias_all_admin" ON public.categorias
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- POLÍTICAS RLS: PROFISSIONAIS
-- ============================================================================

-- Anónimos: ler apenas profissionais aprovados
DROP POLICY IF EXISTS "profissionais_select_anon" ON public.profissionais;
CREATE POLICY "profissionais_select_anon" ON public.profissionais
  FOR SELECT TO anon
  USING (estado = 'aprovado');

-- Autenticados: ler próprios registos (qualquer estado) + aprovados dos outros
DROP POLICY IF EXISTS "profissionais_select_auth" ON public.profissionais;
CREATE POLICY "profissionais_select_auth" ON public.profissionais
  FOR SELECT TO authenticated
  USING (
    estado = 'aprovado'
    OR user_id = auth.uid()
  );

-- Autenticados: criar apenas próprio perfil
DROP POLICY IF EXISTS "profissionais_insert_auth" ON public.profissionais;
CREATE POLICY "profissionais_insert_auth" ON public.profissionais
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Autenticados: atualizar apenas próprio perfil
DROP POLICY IF EXISTS "profissionais_update_auth" ON public.profissionais;
CREATE POLICY "profissionais_update_auth" ON public.profissionais
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Autenticados: eliminar apenas próprio perfil
DROP POLICY IF EXISTS "profissionais_delete_auth" ON public.profissionais;
CREATE POLICY "profissionais_delete_auth" ON public.profissionais
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admin: acesso total
DROP POLICY IF EXISTS "profissionais_all_admin" ON public.profissionais;
CREATE POLICY "profissionais_all_admin" ON public.profissionais
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- POLÍTICAS RLS: SERVIÇOS
-- ============================================================================

-- Anónimos: ler apenas serviços aprovados
DROP POLICY IF EXISTS "servicos_select_anon" ON public.servicos;
CREATE POLICY "servicos_select_anon" ON public.servicos
  FOR SELECT TO anon
  USING (estado = 'aprovado');

-- Autenticados: ler próprios serviços (qualquer estado) + aprovados dos outros
DROP POLICY IF EXISTS "servicos_select_auth" ON public.servicos;
CREATE POLICY "servicos_select_auth" ON public.servicos
  FOR SELECT TO authenticated
  USING (
    estado = 'aprovado'
    OR profissional_id IN (
      SELECT id FROM public.profissionais WHERE user_id = auth.uid()
    )
  );

-- Autenticados: criar apenas serviços associados ao próprio perfil
DROP POLICY IF EXISTS "servicos_insert_auth" ON public.servicos;
CREATE POLICY "servicos_insert_auth" ON public.servicos
  FOR INSERT TO authenticated
  WITH CHECK (
    profissional_id IN (
      SELECT id FROM public.profissionais WHERE user_id = auth.uid()
    )
  );

-- Autenticados: atualizar apenas próprios serviços
DROP POLICY IF EXISTS "servicos_update_auth" ON public.servicos;
CREATE POLICY "servicos_update_auth" ON public.servicos
  FOR UPDATE TO authenticated
  USING (
    profissional_id IN (
      SELECT id FROM public.profissionais WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profissional_id IN (
      SELECT id FROM public.profissionais WHERE user_id = auth.uid()
    )
  );

-- Autenticados: eliminar apenas próprios serviços
DROP POLICY IF EXISTS "servicos_delete_auth" ON public.servicos;
CREATE POLICY "servicos_delete_auth" ON public.servicos
  FOR DELETE TO authenticated
  USING (
    profissional_id IN (
      SELECT id FROM public.profissionais WHERE user_id = auth.uid()
    )
  );

-- Admin: acesso total
DROP POLICY IF EXISTS "servicos_all_admin" ON public.servicos;
CREATE POLICY "servicos_all_admin" ON public.servicos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());