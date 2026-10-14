-- Migração: Tabelas de Avaliações e Denúncias
-- Data: 2026-10-12
-- Descrição: Cria tabelas public.avaliacoes e public.denuncias com RLS

-- ============================================================================
-- EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELA: avaliacoes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id uuid REFERENCES public.profissionais(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES public.servicos(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES public.vagas(id) ON DELETE CASCADE,
  nota smallint NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT avaliacoes_um_alvo CHECK (
    (
      (profissional_id IS NOT NULL)::int +
      (company_id IS NOT NULL)::int +
      (servico_id IS NOT NULL)::int +
      (vaga_id IS NOT NULL)::int
    ) = 1
  ),
  CONSTRAINT avaliacoes_unicas_por_utilizador UNIQUE (
    user_id, profissional_id, company_id, servico_id, vaga_id
  )
);

-- Índices para avaliacoes
CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional ON public.avaliacoes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_company ON public.avaliacoes(company_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_servico ON public.avaliacoes(servico_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_vaga ON public.avaliacoes(vaga_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_user ON public.avaliacoes(user_id);

-- ============================================================================
-- TABELA: denuncias
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.denuncias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id uuid REFERENCES public.profissionais(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES public.servicos(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES public.vagas(id) ON DELETE CASCADE,
  motivo text NOT NULL CHECK (
    motivo IN (
      'conteudo_inadequado',
      'fraude',
      'informacao_falsa',
      'spam',
      'comportamento_abusivo',
      'outro'
    )
  ),
  detalhes text,
  estado text NOT NULL DEFAULT 'pendente' CHECK (
    estado IN ('pendente', 'analisada', 'resolvida', 'arquivada')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolvida_em timestamptz,
  resolvida_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT denuncias_um_alvo CHECK (
    (
      (profissional_id IS NOT NULL)::int +
      (company_id IS NOT NULL)::int +
      (servico_id IS NOT NULL)::int +
      (vaga_id IS NOT NULL)::int
    ) = 1
  )
);

-- Índices para denuncias
CREATE INDEX IF NOT EXISTS idx_denuncias_profissional ON public.denuncias(profissional_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_company ON public.denuncias(company_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_servico ON public.denuncias(servico_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_vaga ON public.denuncias(vaga_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_estado ON public.denuncias(estado);
CREATE INDEX IF NOT EXISTS idx_denuncias_user ON public.denuncias(user_id);

-- ============================================================================
-- TRIGGER updated_at para avaliacoes
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_avaliacoes_updated_at ON public.avaliacoes;
CREATE TRIGGER trigger_avaliacoes_updated_at
  BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS: avaliacoes
-- ============================================================================

-- SELECT anon: apenas avaliações de alvos aprovados
DROP POLICY IF EXISTS "avaliacoes_select_anon" ON public.avaliacoes;
CREATE POLICY "avaliacoes_select_anon" ON public.avaliacoes
  FOR SELECT TO anon
  USING (
    (profissional_id IS NULL OR EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.id = profissional_id AND p.estado = 'aprovado'
    ))
    AND (company_id IS NULL OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.is_approved = true
    ))
    AND (servico_id IS NULL OR EXISTS (
      SELECT 1 FROM public.servicos s
      WHERE s.id = servico_id AND s.estado = 'aprovado'
    ))
    AND (vaga_id IS NULL OR EXISTS (
      SELECT 1 FROM public.vagas v
      WHERE v.id = vaga_id AND v.estado = 'aprovado'
    ))
  );

-- SELECT authenticated: mesmo que anon + pode ver próprias avaliações (mesmo em alvos não aprovados)
DROP POLICY IF EXISTS "avaliacoes_select_auth" ON public.avaliacoes;
CREATE POLICY "avaliacoes_select_auth" ON public.avaliacoes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      (profissional_id IS NULL OR EXISTS (
        SELECT 1 FROM public.profissionais p
        WHERE p.id = profissional_id AND p.estado = 'aprovado'
      ))
      AND (company_id IS NULL OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND c.is_approved = true
      ))
      AND (servico_id IS NULL OR EXISTS (
        SELECT 1 FROM public.servicos s
        WHERE s.id = servico_id AND s.estado = 'aprovado'
      ))
      AND (vaga_id IS NULL OR EXISTS (
        SELECT 1 FROM public.vagas v
        WHERE v.id = vaga_id AND v.estado = 'aprovado'
      ))
    )
  );

-- INSERT authenticated: próprio user_id, exatamente um alvo, alvo aprovado
DROP POLICY IF EXISTS "avaliacoes_insert_auth" ON public.avaliacoes;
CREATE POLICY "avaliacoes_insert_auth" ON public.avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (profissional_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profissionais p
        WHERE p.id = profissional_id AND p.estado = 'aprovado'
      ))
      OR (company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND c.is_approved = true
      ))
      OR (servico_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.servicos s
        WHERE s.id = servico_id AND s.estado = 'aprovado'
      ))
      OR (vaga_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.vagas v
        WHERE v.id = vaga_id AND v.estado = 'aprovado'
      ))
    )
  );

-- UPDATE authenticated: apenas próprias avaliações
DROP POLICY IF EXISTS "avaliacoes_update_auth" ON public.avaliacoes;
CREATE POLICY "avaliacoes_update_auth" ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE authenticated: apenas próprias avaliações
DROP POLICY IF EXISTS "avaliacoes_delete_auth" ON public.avaliacoes;
CREATE POLICY "avaliacoes_delete_auth" ON public.avaliacoes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ALL admin
DROP POLICY IF EXISTS "avaliacoes_all_admin" ON public.avaliacoes;
CREATE POLICY "avaliacoes_all_admin" ON public.avaliacoes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- POLÍTICAS RLS: denuncias
-- ============================================================================

-- SELECT authenticated: próprias denúncias ou admin
DROP POLICY IF EXISTS "denuncias_select_auth" ON public.denuncias;
CREATE POLICY "denuncias_select_auth" ON public.denuncias
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
  );

-- INSERT authenticated: próprio user_id, exatamente um alvo
DROP POLICY IF EXISTS "denuncias_insert_auth" ON public.denuncias;
CREATE POLICY "denuncias_insert_auth" ON public.denuncias
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (profissional_id IS NOT NULL)::int +
      (company_id IS NOT NULL)::int +
      (servico_id IS NOT NULL)::int +
      (vaga_id IS NOT NULL)::int
    ) = 1
  );

-- UPDATE authenticated: apenas admin
DROP POLICY IF EXISTS "denuncias_update_auth" ON public.denuncias;
CREATE POLICY "denuncias_update_auth" ON public.denuncias
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE authenticated: apenas admin
DROP POLICY IF EXISTS "denuncias_delete_auth" ON public.denuncias;
CREATE POLICY "denuncias_delete_auth" ON public.denuncias
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ALL admin (redundante com UPDATE/DELETE mas explícito)
DROP POLICY IF EXISTS "denuncias_all_admin" ON public.denuncias;
CREATE POLICY "denuncias_all_admin" ON public.denuncias
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
