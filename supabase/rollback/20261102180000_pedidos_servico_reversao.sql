-- =====================================================================
-- REVERSÃO — pedidos de serviço (migração 20261102180000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- Remove a tabela pedidos_servico (com policies, índices, triggers, CHECK e grants) e as quatro funções auxiliares.
-- Aborta se a tabela tiver registos: apagar pedidos é uma decisão separada.
-- Não altera profissionais, servicos, políticas existentes nem outras funções.
-- =====================================================================

BEGIN;

DO $pre$
DECLARE
  v_n bigint;
BEGIN
  IF to_regclass('public.pedidos_servico') IS NULL THEN
    RAISE NOTICE 'Tabela public.pedidos_servico não existe. Nada a reverter na tabela.';
    RETURN;
  END IF;

  SELECT count(*) INTO v_n FROM public.pedidos_servico;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Reversão cancelada: public.pedidos_servico tem % registo(s). Decidir antes o que fazer aos dados.', v_n;
  END IF;
END
$pre$;

DROP TABLE IF EXISTS public.pedidos_servico;

DROP FUNCTION IF EXISTS public.validar_servico_pedido();
DROP FUNCTION IF EXISTS public.validar_transicao_pedido();
DROP FUNCTION IF EXISTS public.profissional_aprovado(uuid);
DROP FUNCTION IF EXISTS public.profissional_aprovado_id();

COMMIT;
