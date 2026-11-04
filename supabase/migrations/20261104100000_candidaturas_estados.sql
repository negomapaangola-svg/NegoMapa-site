-- Estados completos da candidatura: enviada, vista, em_analise, aceite, rejeitada, arquivada.
-- 1. Substitui o CHECK de estado (antes só aceitava 4 valores).
-- 2. Recria a política de update da empresa para aceitar os 6 estados.
--    A política do admin mantém-se como estava (fora do âmbito deste passo).
-- Não altera grants: UPDATE (estado) continua concedido a authenticated.

ALTER TABLE public.candidaturas
  DROP CONSTRAINT IF EXISTS candidaturas_estado_check;

ALTER TABLE public.candidaturas
  ADD CONSTRAINT candidaturas_estado_check
  CHECK (estado = ANY (ARRAY['enviada'::text, 'vista'::text, 'em_analise'::text, 'aceite'::text, 'rejeitada'::text, 'arquivada'::text]));

DROP POLICY IF EXISTS candidaturas_update_empresa ON public.candidaturas;

CREATE POLICY candidaturas_update_empresa
  ON public.candidaturas
  FOR UPDATE
  TO authenticated
  USING (empresa_dona_da_vaga(vaga_id))
  WITH CHECK (
    empresa_dona_da_vaga(vaga_id)
    AND estado = ANY (ARRAY['enviada'::text, 'vista'::text, 'em_analise'::text, 'aceite'::text, 'rejeitada'::text, 'arquivada'::text])
  );
