-- Reversão da FASE 2.
-- Só executar se não existirem vagas encerradas; a coluna nova contém a data de encerramento.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.vagas') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'vagas' AND column_name = 'encerrada_em'
     ) THEN
    RAISE EXCEPTION 'Reversão FASE 2: coluna encerrada_em não existe';
  END IF;

  IF EXISTS (SELECT 1 FROM public.vagas WHERE encerrada_em IS NOT NULL) THEN
    RAISE EXCEPTION 'Reversão FASE 2 bloqueada: existem vagas encerradas; exportar e reconciliar estes valores antes de reverter';
  END IF;
END
$$;

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
       AND c.is_approved = true
  )
$function$;

DROP POLICY IF EXISTS vagas_public_open_only ON public.vagas;
ALTER TABLE public.vagas DROP COLUMN encerrada_em;

COMMIT;
