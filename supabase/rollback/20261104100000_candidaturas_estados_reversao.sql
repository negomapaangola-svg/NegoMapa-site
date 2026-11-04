-- REVERSÃO de 20261104100000_candidaturas_estados.sql
-- Repõe os 4 estados originais e a política de update da empresa anterior.
-- ATENÇÃO: candidaturas em 'vista' passam a 'em_analise' e em 'arquivada' passam a 'rejeitada'.
-- Essa conversão perde a distinção entre estados. Só executar se necessário.

-- 1. Converte os estados novos para os antigos, antes de repor o CHECK.
UPDATE public.candidaturas SET estado = 'em_analise' WHERE estado = 'vista';
UPDATE public.candidaturas SET estado = 'rejeitada' WHERE estado = 'arquivada';

-- 2. Repõe o CHECK original.
ALTER TABLE public.candidaturas
  DROP CONSTRAINT IF EXISTS candidaturas_estado_check;

ALTER TABLE public.candidaturas
  ADD CONSTRAINT candidaturas_estado_check
  CHECK (estado = ANY (ARRAY['enviada'::text, 'em_analise'::text, 'aceite'::text, 'rejeitada'::text]));

-- 3. Repõe a política de update da empresa original.
DROP POLICY IF EXISTS candidaturas_update_empresa ON public.candidaturas;

CREATE POLICY candidaturas_update_empresa
  ON public.candidaturas
  FOR UPDATE
  TO authenticated
  USING (empresa_dona_da_vaga(vaga_id))
  WITH CHECK (
    empresa_dona_da_vaga(vaga_id)
    AND estado = ANY (ARRAY['em_analise'::text, 'aceite'::text, 'rejeitada'::text])
  );
