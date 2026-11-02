-- =====================================================================
-- REVERSÃO — conversas e mensagens (migração 20261102200000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- Remove as tabelas mensagens e conversas (com policies, índices, constraints e grants)
-- e as três funções auxiliares.
-- Aborta se alguma das tabelas tiver registos: apagar conversas é uma decisão separada.
-- =====================================================================

BEGIN;

DO $pre$
DECLARE
  v_m bigint := 0;
  v_c bigint := 0;
BEGIN
  IF to_regclass('public.mensagens') IS NOT NULL THEN
    SELECT count(*) INTO v_m FROM public.mensagens;
  END IF;
  IF to_regclass('public.conversas') IS NOT NULL THEN
    SELECT count(*) INTO v_c FROM public.conversas;
  END IF;
  IF v_m > 0 OR v_c > 0 THEN
    RAISE EXCEPTION 'Reversão cancelada: mensagens=% conversas=%. Decidir antes o que fazer aos dados.', v_m, v_c;
  END IF;
END
$pre$;

-- Ordem: primeiro a tabela que referencia a outra
DROP TABLE IF EXISTS public.mensagens;
DROP TABLE IF EXISTS public.conversas;

DROP FUNCTION IF EXISTS public.conversa_participante(uuid);
DROP FUNCTION IF EXISTS public.perfil_profissional_aprovado(uuid);
DROP FUNCTION IF EXISTS public.empresa_aprovada(uuid);

COMMIT;
