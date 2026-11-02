-- =====================================================================
-- REVERSÃO — tabela de notificações (migração 20261102170000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- Remove a função criar_notificacao() e a tabela notificacoes (com as policies, índices e grants).
-- Aborta se a tabela tiver registos: apagar notificações é uma decisão separada.
-- Não altera outras tabelas, políticas nem funções.
-- =====================================================================

BEGIN;

DO $pre$
DECLARE
  v_n bigint;
BEGIN
  IF to_regclass('public.notificacoes') IS NULL THEN
    RAISE NOTICE 'Tabela public.notificacoes não existe. Nada a reverter na tabela.';
    RETURN;
  END IF;

  SELECT count(*) INTO v_n FROM public.notificacoes;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Reversão cancelada: public.notificacoes tem % registo(s). Decidir antes o que fazer aos dados.', v_n;
  END IF;
END
$pre$;

DROP FUNCTION IF EXISTS public.criar_notificacao(uuid, text, text, text, text, uuid);

DROP TABLE IF EXISTS public.notificacoes;

COMMIT;
