-- =============================================================================
-- FASE 3B — Modelo comercial corrigido para serviços de empresas e profissionais
-- Migração incremental, idempotente e compatível com a aplicação actual.
-- Não altera registos, produtos, avaliações ou vistas já existentes.
--
-- Não executa DML de dados, não apaga tabelas/colunas/serviços e não reclassifica
-- utilizadores. Os serviços existentes continuam associados aos profissionais.
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.servicos') IS NULL
     OR to_regclass('public.companies') IS NULL
     OR to_regclass('public.profissionais') IS NULL THEN
    RAISE EXCEPTION 'FASE 3B: faltam tabelas-base; migração cancelada';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'negomapa_public_view_owner') THEN
    RAISE EXCEPTION 'FASE 3B: role negomapa_public_view_owner inexistente';
  END IF;
  IF to_regprocedure('public.is_admin()') IS NULL
     OR to_regprocedure('negomapa_private.is_account_active(uuid)') IS NULL THEN
    RAISE EXCEPTION 'FASE 3B: funções de autorização/conta activa inexistentes';
  END IF;
END
$$;

-- 1. Propriedade exclusiva: empresa OU profissional.
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.servicos ALTER COLUMN profissional_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.servicos'::regclass
      AND conname = 'servicos_company_id_fkey'
  ) THEN
    ALTER TABLE public.servicos
      ADD CONSTRAINT servicos_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES public.companies(id)
      ON DELETE RESTRICT NOT VALID;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.servicos
    WHERE (CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN profissional_id IS NOT NULL THEN 1 ELSE 0 END) <> 1
  ) THEN
    RAISE EXCEPTION 'FASE 3B: existem serviços sem proprietário ou com dois proprietários; validação cancelada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.servicos'::regclass
      AND conname = 'servicos_um_proprietario_check'
  ) THEN
    ALTER TABLE public.servicos
      ADD CONSTRAINT servicos_um_proprietario_check
      CHECK (
        (CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN profissional_id IS NOT NULL THEN 1 ELSE 0 END) = 1
      ) NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.servicos VALIDATE CONSTRAINT servicos_company_id_fkey;
ALTER TABLE public.servicos VALIDATE CONSTRAINT servicos_um_proprietario_check;

CREATE INDEX IF NOT EXISTS idx_servicos_company_id ON public.servicos(company_id);
CREATE INDEX IF NOT EXISTS idx_servicos_profissional_id ON public.servicos(profissional_id);

-- 2. Impedir transferência de propriedade e adulteração de dados de moderação.
CREATE OR REPLACE FUNCTION public.proteger_propriedade_servico()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF current_user IN ('postgres', 'service_role') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF (CASE WHEN NEW.company_id IS NOT NULL THEN 1 ELSE 0 END)
       + (CASE WHEN NEW.profissional_id IS NOT NULL THEN 1 ELSE 0 END) <> 1 THEN
      RAISE EXCEPTION 'O serviço deve pertencer a uma única empresa ou profissional';
    END IF;

    IF NEW.company_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = NEW.company_id AND c.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'A empresa indicada não pertence ao utilizador autenticado';
    END IF;

    IF NEW.profissional_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.id = NEW.profissional_id AND p.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'O profissional indicado não pertence ao utilizador autenticado';
    END IF;

    IF NEW.motivo_rejeicao IS NOT NULL
       OR NEW.avaliado_em IS NOT NULL
       OR NEW.avaliado_por IS NOT NULL THEN
      RAISE EXCEPTION 'Campos de moderação só podem ser definidos por administradores';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.profissional_id IS DISTINCT FROM OLD.profissional_id THEN
    RAISE EXCEPTION 'A propriedade de um serviço não pode ser transferida';
  END IF;

  IF NEW.motivo_rejeicao IS DISTINCT FROM OLD.motivo_rejeicao
     OR NEW.avaliado_em IS DISTINCT FROM OLD.avaliado_em
     OR NEW.avaliado_por IS DISTINCT FROM OLD.avaliado_por THEN
    RAISE EXCEPTION 'Campos de moderação só podem ser alterados por administradores';
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.proteger_propriedade_servico()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_proteger_propriedade_servico ON public.servicos;
CREATE TRIGGER trg_proteger_propriedade_servico
  BEFORE INSERT OR UPDATE ON public.servicos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_propriedade_servico();

-- Reafirma a protecção de estado existente (apenas administradores aprovam).
DO $$
BEGIN
  IF to_regprocedure('public.proteger_estado()') IS NULL THEN
    RAISE EXCEPTION 'FASE 3B: função public.proteger_estado() inexistente';
  END IF;
END
$$;
DROP TRIGGER IF EXISTS trg_proteger_estado_servicos ON public.servicos;
CREATE TRIGGER trg_proteger_estado_servicos
  BEFORE INSERT OR UPDATE ON public.servicos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_estado();

-- 3. RLS. A política restritiva de conta activa existente mantém-se.
DROP POLICY IF EXISTS "active_owner_public_select" ON public.servicos;
CREATE POLICY "active_owner_public_select"
  ON public.servicos AS RESTRICTIVE FOR SELECT TO anon
  USING (
    (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = servicos.company_id
          AND c.is_approved IS TRUE
          AND negomapa_private.is_account_active(c.user_id)
      )
    )
    OR
    (
      profissional_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.profissionais p
        WHERE p.id = servicos.profissional_id
          AND p.estado = 'aprovado'
          AND negomapa_private.is_account_active(p.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "active_owner_authenticated_select" ON public.servicos;
CREATE POLICY "active_owner_authenticated_select"
  ON public.servicos AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = servicos.company_id
          AND negomapa_private.is_account_active(c.user_id)
      )
    )
    OR (
      profissional_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.profissionais p
        WHERE p.id = servicos.profissional_id
          AND negomapa_private.is_account_active(p.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "servicos_select_anon" ON public.servicos;
CREATE POLICY "servicos_select_anon"
  ON public.servicos FOR SELECT TO anon
  USING (
    estado = 'aprovado'
    AND (
      (
        company_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.companies c
          WHERE c.id = servicos.company_id AND c.is_approved IS TRUE
        )
      )
      OR
      (
        profissional_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.profissionais p
          WHERE p.id = servicos.profissional_id AND p.estado = 'aprovado'
        )
      )
    )
  );

DROP POLICY IF EXISTS "servicos_select_auth" ON public.servicos;
CREATE POLICY "servicos_select_auth"
  ON public.servicos FOR SELECT TO authenticated
  USING (
    (
      estado = 'aprovado'
      AND (
        (
          company_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = servicos.company_id AND c.is_approved IS TRUE
          )
        )
        OR
        (
          profissional_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.profissionais p
            WHERE p.id = servicos.profissional_id AND p.estado = 'aprovado'
          )
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = servicos.company_id AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.id = servicos.profissional_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "servicos_insert_auth" ON public.servicos;
CREATE POLICY "servicos_insert_auth"
  ON public.servicos FOR INSERT TO authenticated
  WITH CHECK (
    (
      company_id IS NOT NULL AND profissional_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = servicos.company_id AND c.user_id = auth.uid()
      )
    )
    OR
    (
      profissional_id IS NOT NULL AND company_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.profissionais p
        WHERE p.id = servicos.profissional_id AND p.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "servicos_update_auth" ON public.servicos;
CREATE POLICY "servicos_update_auth"
  ON public.servicos FOR UPDATE TO authenticated
  USING (
    (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = servicos.company_id AND c.user_id = auth.uid()
      )
    )
    OR
    (
      profissional_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.profissionais p
        WHERE p.id = servicos.profissional_id AND p.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    (
      company_id IS NOT NULL AND profissional_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = servicos.company_id AND c.user_id = auth.uid()
      )
    )
    OR
    (
      profissional_id IS NOT NULL AND company_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.profissionais p
        WHERE p.id = servicos.profissional_id AND p.user_id = auth.uid()
      )
    )
  );

-- Sem DELETE para proprietários; a política ALL administrativa mantém-se.
DROP POLICY IF EXISTS "servicos_delete_auth" ON public.servicos;
DROP POLICY IF EXISTS "servicos_all_admin" ON public.servicos;
CREATE POLICY "servicos_all_admin"
  ON public.servicos FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "servicos_select_public_view_owner" ON public.servicos;
CREATE POLICY "servicos_select_public_view_owner"
  ON public.servicos FOR SELECT TO negomapa_public_view_owner
  USING (
    estado = 'aprovado'
    AND (
      (
        company_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.companies c
          WHERE c.id = servicos.company_id AND c.is_approved IS TRUE
        )
      )
      OR
      (
        profissional_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.profissionais p
          WHERE p.id = servicos.profissional_id AND p.estado = 'aprovado'
        )
      )
    )
  );

-- 4. Privilégios. anon não escreve e só lê colunas públicas compatíveis com
-- a listagem actual. company_id e campos administrativos não são expostos.
REVOKE ALL PRIVILEGES ON TABLE public.servicos FROM anon;
REVOKE SELECT (
  id, profissional_id, company_id, categoria_id, titulo, slug, descricao,
  preco, preco_tipo, whatsapp, provincia, municipio, estado, created_at,
  updated_at, motivo_rejeicao, avaliado_em, avaliado_por
) ON TABLE public.servicos FROM anon;

GRANT SELECT (
  id, profissional_id, categoria_id, titulo, slug, descricao, preco,
  preco_tipo, whatsapp, provincia, municipio, estado, created_at, updated_at
) ON TABLE public.servicos TO anon;

GRANT SELECT (
  id, company_id, profissional_id, categoria_id, titulo, slug, descricao,
  preco, preco_tipo, whatsapp, provincia, municipio, estado, created_at
) ON TABLE public.servicos TO negomapa_public_view_owner;

GRANT SELECT (id, name, user_id, is_approved)
  ON TABLE public.companies TO negomapa_public_view_owner;
GRANT SELECT (id, nome, user_id, estado)
  ON TABLE public.profissionais TO negomapa_public_view_owner;
GRANT USAGE ON SCHEMA negomapa_private
  TO anon, authenticated, service_role, negomapa_public_view_owner;

-- 5. Vista interna sanitizada, propriedade da role RLS dedicada.
CREATE OR REPLACE VIEW negomapa_private.v_servicos_publicos
WITH (security_barrier = true, security_invoker = false)
AS
  SELECT
    s.id, s.categoria_id, s.titulo, s.slug, s.descricao, s.preco,
    s.preco_tipo, s.whatsapp, s.provincia, s.municipio, s.created_at,
    'empresa'::text AS prestador_tipo, c.name AS prestador_nome
  FROM public.servicos s
  JOIN public.companies c ON c.id = s.company_id
  WHERE s.company_id IS NOT NULL
    AND s.profissional_id IS NULL
    AND s.estado = 'aprovado'
    AND c.is_approved IS TRUE
    AND negomapa_private.is_account_active(c.user_id)

  UNION ALL

  SELECT
    s.id, s.categoria_id, s.titulo, s.slug, s.descricao, s.preco,
    s.preco_tipo, s.whatsapp, s.provincia, s.municipio, s.created_at,
    'profissional'::text AS prestador_tipo, p.nome AS prestador_nome
  FROM public.servicos s
  JOIN public.profissionais p ON p.id = s.profissional_id
  WHERE s.profissional_id IS NOT NULL
    AND s.company_id IS NULL
    AND s.estado = 'aprovado'
    AND p.estado = 'aprovado'
    AND negomapa_private.is_account_active(p.user_id);

GRANT CREATE ON SCHEMA negomapa_private TO negomapa_public_view_owner;
ALTER VIEW negomapa_private.v_servicos_publicos
  OWNER TO negomapa_public_view_owner;
REVOKE CREATE ON SCHEMA negomapa_private FROM negomapa_public_view_owner;

GRANT SELECT ON TABLE negomapa_private.v_servicos_publicos
  TO anon, authenticated, service_role;

-- A vista pública invoca as permissões do utilizador que consulta.
CREATE OR REPLACE VIEW public.servicos_publicos
WITH (security_invoker = true, security_barrier = true)
AS
  SELECT
    id, categoria_id, titulo, slug, descricao, preco, preco_tipo, whatsapp,
    provincia, municipio, created_at, prestador_tipo, prestador_nome
  FROM negomapa_private.v_servicos_publicos;

GRANT SELECT ON TABLE public.servicos_publicos
  TO anon, authenticated, service_role;

-- 6. Verificações pós-condição. Qualquer falha aborta a migração.
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.servicos'::regclass) THEN
    RAISE EXCEPTION 'FASE 3B: RLS não está activo em public.servicos';
  END IF;

  IF has_table_privilege('anon', 'public.servicos', 'INSERT')
     OR has_table_privilege('anon', 'public.servicos', 'UPDATE')
     OR has_table_privilege('anon', 'public.servicos', 'DELETE')
     OR has_table_privilege('anon', 'public.servicos', 'TRUNCATE') THEN
    RAISE EXCEPTION 'FASE 3B: anon ainda possui privilégios de escrita';
  END IF;

  IF has_column_privilege('anon', 'public.servicos', 'company_id', 'SELECT')
     OR has_column_privilege('anon', 'public.servicos', 'motivo_rejeicao', 'SELECT')
     OR has_column_privilege('anon', 'public.servicos', 'avaliado_em', 'SELECT')
     OR has_column_privilege('anon', 'public.servicos', 'avaliado_por', 'SELECT') THEN
    RAISE EXCEPTION 'FASE 3B: anon consegue ler campos privados/administrativos';
  END IF;

  IF NOT has_column_privilege('anon', 'public.servicos', 'profissional_id', 'SELECT') THEN
    RAISE EXCEPTION 'FASE 3B: compatibilidade da aplicação actual foi quebrada';
  END IF;

  IF NOT has_table_privilege('anon', 'public.servicos_publicos', 'SELECT') THEN
    RAISE EXCEPTION 'FASE 3B: anon sem SELECT em servicos_publicos';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'servicos_publicos'
      AND c.relkind = 'v'
      AND 'security_invoker=true' = ANY (c.reloptions)
  ) THEN
    RAISE EXCEPTION 'FASE 3B: servicos_publicos não tem security_invoker=true';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'servicos_publicos'
      AND column_name IN (
        'company_id', 'profissional_id', 'user_id', 'documents_url', 'nif',
        'motivo_rejeicao', 'avaliado_em', 'avaliado_por'
      )
  ) THEN
    RAISE EXCEPTION 'FASE 3B: vista pública contém campos privados/administrativos';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'servicos'
      AND policyname = 'servicos_insert_auth' AND cmd = 'INSERT'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'servicos'
      AND policyname = 'servicos_update_auth' AND cmd = 'UPDATE'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'servicos'
      AND policyname = 'servicos_all_admin' AND cmd = 'ALL'
  ) THEN
    RAISE EXCEPTION 'FASE 3B: políticas de proprietário/admin em falta';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'servicos'
      AND policyname = 'servicos_delete_auth'
  ) THEN
    RAISE EXCEPTION 'FASE 3B: política de DELETE de proprietário ainda existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.servicos'::regclass
      AND conname = 'servicos_um_proprietario_check' AND convalidated
  ) THEN
    RAISE EXCEPTION 'FASE 3B: constraint de propriedade exclusiva não validada';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.servicos
    WHERE (CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN profissional_id IS NOT NULL THEN 1 ELSE 0 END) <> 1
  ) THEN
    RAISE EXCEPTION 'FASE 3B: existe serviço sem proprietário exclusivo';
  END IF;
END
$$;

-- Nenhum INSERT, UPDATE, DELETE ou TRUNCATE de dados foi executado por esta
-- migração. Produtos, avaliacoes_um_alvo e vistas existentes permanecem intactos.
