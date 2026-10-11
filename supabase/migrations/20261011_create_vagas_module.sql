-- Migração: Módulo de Vagas
-- Projeto: NegóMapa
-- Data: 2026-10-11

-- ============================================================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

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
-- TABELA: vagas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  slug text UNIQUE NOT NULL,
  descricao text NOT NULL,
  requisitos text,
  categoria text NOT NULL,
  provincia text NOT NULL,
  municipio text,
  tipo_contrato text,
  salario text,
  whatsapp text,
  estado text NOT NULL CHECK (estado IN ('pendente', 'aprovado', 'rejeitado')) DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vagas_company_id ON public.vagas(company_id);
CREATE INDEX IF NOT EXISTS idx_vagas_estado ON public.vagas(estado);
CREATE INDEX IF NOT EXISTS idx_vagas_provincia ON public.vagas(provincia);
CREATE INDEX IF NOT EXISTS idx_vagas_categoria ON public.vagas(categoria);
CREATE INDEX IF NOT EXISTS idx_vagas_slug ON public.vagas(slug);

-- ============================================================================
-- TRIGGERS PARA updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_vagas_updated_at ON public.vagas;
CREATE TRIGGER trigger_vagas_updated_at
  BEFORE UPDATE ON public.vagas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS: VAGAS
-- ============================================================================

-- SELECT público: apenas vagas aprovadas de empresas aprovadas
DROP POLICY IF EXISTS "vagas_select_anon" ON public.vagas;
CREATE POLICY "vagas_select_anon" ON public.vagas
  FOR SELECT TO anon
  USING (
    estado = 'aprovado'
    AND company_id IN (
      SELECT id FROM public.companies WHERE is_approved = true
    )
  );

-- SELECT autenticado: vagas aprovadas de empresas aprovadas + próprias vagas (qualquer estado)
DROP POLICY IF EXISTS "vagas_select_auth" ON public.vagas;
CREATE POLICY "vagas_select_auth" ON public.vagas
  FOR SELECT TO authenticated
  USING (
    estado = 'aprovado'
    AND company_id IN (
      SELECT id FROM public.companies WHERE is_approved = true
    )
    OR company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- INSERT: apenas utilizador autenticado associado à empresa
DROP POLICY IF EXISTS "vagas_insert_auth" ON public.vagas;
CREATE POLICY "vagas_insert_auth" ON public.vagas
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- UPDATE: apenas o proprietário da empresa pode actualizar a própria vaga
DROP POLICY IF EXISTS "vagas_update_auth" ON public.vagas;
CREATE POLICY "vagas_update_auth" ON public.vagas
  FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- DELETE: apenas o proprietário da empresa pode eliminar a própria vaga
DROP POLICY IF EXISTS "vagas_delete_auth" ON public.vagas;
CREATE POLICY "vagas_delete_auth" ON public.vagas
  FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Admin: acesso completo
DROP POLICY IF EXISTS "vagas_all_admin" ON public.vagas;
CREATE POLICY "vagas_all_admin" ON public.vagas
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());