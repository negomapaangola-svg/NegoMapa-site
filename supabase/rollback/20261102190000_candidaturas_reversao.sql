-- =====================================================================
-- REVERSÃO — candidaturas (migração 20261102190000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- Remove a tabela candidaturas (com policies, índices, constraint e grants) e as duas funções auxiliares.
-- Aborta se a tabela tiver registos: apagar candidaturas é uma decisão separada.
-- Não altera vagas, companies nem outras tabelas.
-- =====================================================================

BEGIN;

DO $pre$
DECLARE
  v_n bigint;
BEGIN
  IF to_regclass('public.candidaturas') IS NULL THEN
    RAISE NOTICE 'Tabela public.candidaturas não existe. Nada a reverter na tabela.';
    RETURN;
  END IF;

  SELECT count(*) INTO v_n FROM public.candidaturas;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Reversão cancelada: public.candidaturas tem % registo(s). Decidir antes o que fazer aos dados.', v_n;
  END IF;
END
$pre$;

DROP TABLE IF EXISTS public.candidaturas;

DROP FUNCTION IF EXISTS public.vaga_disponivel_para_candidatura(uuid);
DROP FUNCTION IF EXISTS public.empresa_dona_da_vaga(uuid);

COMMIT;
