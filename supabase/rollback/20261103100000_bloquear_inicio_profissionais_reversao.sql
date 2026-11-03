-- =====================================================================
-- REVERSÃO — bloqueio de início por profissionais (migração 20261103100000)
-- Repõe exatamente as políticas de INSERT anteriores e remove a função nova.
-- Não toca em dados, mensagens, candidaturas nem outras políticas.
-- =====================================================================

BEGIN;

DROP POLICY conversas_insert_cliente ON public.conversas;

CREATE POLICY conversas_insert_cliente ON public.conversas
  FOR INSERT TO authenticated
  WITH CHECK (
    cliente_id = (SELECT auth.uid())
    AND (empresa_id IS NULL OR empresa_id NOT IN (
          SELECT e.id FROM public.companies e WHERE e.user_id = (SELECT auth.uid())))
    AND (profissional_id IS NULL OR profissional_id NOT IN (
          SELECT p.id FROM public.profissionais p WHERE p.user_id = (SELECT auth.uid())))
    AND (
      (profissional_id IS NOT NULL AND public.perfil_profissional_aprovado(profissional_id))
      OR (empresa_id IS NOT NULL AND public.empresa_aprovada(empresa_id))
    )
  );

DROP POLICY pedidos_servico_insert_cliente ON public.pedidos_servico;

CREATE POLICY pedidos_servico_insert_cliente ON public.pedidos_servico
  FOR INSERT TO authenticated
  WITH CHECK (
    cliente_id = (SELECT auth.uid())
    AND estado = 'novo'
    AND (profissional_id IS NULL OR public.profissional_aprovado(profissional_id))
  );

DROP FUNCTION IF EXISTS public.utilizador_e_profissional();

COMMIT;
