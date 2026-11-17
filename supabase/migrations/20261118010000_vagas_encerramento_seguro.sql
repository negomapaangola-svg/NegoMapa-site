-- FASE 2 — Encerramento de vagas sem alterar o estado de aprovação.
-- A coluna é aditiva; não altera registos existentes nem a regra de aprovação automática.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.vagas') IS NULL
     OR to_regclass('public.candidaturas') IS NULL
     OR to_regclass('negomapa_private.v_vagas_publicas') IS NULL
     OR to_regprocedure('negomapa_private.is_account_active(uuid)') IS NULL
     OR to_regprocedure('public.vaga_disponivel_para_candidatura(uuid)') IS NULL THEN
    RAISE EXCEPTION 'FASE 2: esquema base incompleto; migração cancelada';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vagas' AND column_name = 'encerrada_em'
  ) THEN
    RAISE EXCEPTION 'FASE 2: coluna encerrada_em já existe; verificar drift antes de continuar';
  END IF;
END
$$;

ALTER TABLE public.vagas
  ADD COLUMN encerrada_em timestamptz NULL;

COMMENT ON COLUMN public.vagas.encerrada_em IS
  'Momento em que a empresa proprietária encerrou a vaga; NULL significa que continua aberta.';

-- A vista é executada pela role dedicada. Conceder apenas a nova coluna interna
-- necessária ao filtro; a coluna não é exposta pela vista pública.
GRANT SELECT (encerrada_em) ON TABLE public.vagas TO negomapa_public_view_owner;

CREATE OR REPLACE FUNCTION public.vaga_disponivel_para_candidatura(p_vaga_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
      FROM public.vagas v
      JOIN public.companies c ON c.id = v.company_id
     WHERE v.id = p_vaga_id
       AND v.estado = 'aprovado'
       AND v.encerrada_em IS NULL
       AND c.is_approved IS TRUE
       AND negomapa_private.is_account_active(c.user_id)
  )
$function$;

CREATE OR REPLACE VIEW negomapa_private.v_vagas_publicas
WITH (security_barrier = true, security_invoker = false)
AS
  SELECT
    v.id,
    v.company_id,
    v.titulo,
    v.slug,
    v.descricao,
    v.requisitos,
    v.categoria,
    v.provincia,
    v.municipio,
    v.tipo_contrato,
    v.salario,
    v.estado,
    v.created_at
  FROM public.vagas v
  WHERE v.encerrada_em IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vagas' AND column_name = 'encerrada_em'
  ) THEN
    RAISE EXCEPTION 'FASE 2: coluna de encerramento não criada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vagas'
      AND policyname = 'vagas_update_auth' AND cmd = 'UPDATE'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'candidaturas'
      AND policyname = 'candidaturas_select_candidato' AND cmd = 'SELECT'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'candidaturas'
      AND policyname = 'candidaturas_select_empresa' AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'FASE 2: políticas de propriedade/privacidade em falta';
  END IF;

  IF NOT has_column_privilege('negomapa_public_view_owner', 'public.vagas', 'encerrada_em', 'SELECT') THEN
    RAISE EXCEPTION 'FASE 2: role da vista pública sem acesso à coluna de encerramento';
  END IF;

  IF pg_get_viewdef('negomapa_private.v_vagas_publicas'::regclass, true) NOT ILIKE '%encerrada_em IS NULL%' THEN
    RAISE EXCEPTION 'FASE 2: a vista pública não exclui vagas encerradas';
  END IF;

  IF pg_get_functiondef('public.vaga_disponivel_para_candidatura(uuid)'::regprocedure) NOT ILIKE '%encerrada_em IS NULL%'
     OR pg_get_functiondef('public.vaga_disponivel_para_candidatura(uuid)'::regprocedure) NOT ILIKE '%is_account_active%' THEN
    RAISE EXCEPTION 'FASE 2: a validação de candidatura não bloqueia vaga encerrada/empresa inactiva';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.candidaturas'::regclass
      AND conname = 'candidaturas_vaga_user_unica'
  ) THEN
    RAISE EXCEPTION 'FASE 2: restrição contra candidaturas duplicadas em falta';
  END IF;
END
$$;

COMMIT;
