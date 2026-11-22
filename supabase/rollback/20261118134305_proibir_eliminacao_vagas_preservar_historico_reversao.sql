-- Reversão da FASE 2 — restaurar a política e FKs CASCADE anteriores.
-- ATENÇÃO: esta reversão volta a permitir eliminação pelo proprietário e
-- restabelece o risco de perda em cascata. Executar apenas com autorização.
BEGIN;

DROP TRIGGER IF EXISTS trg_preservar_notificacoes_vaga ON public.vagas;
DROP TRIGGER IF EXISTS trg_validar_referencia_notificacao_vaga ON public.notificacoes;
DROP FUNCTION IF EXISTS public.impedir_eliminacao_vaga_com_notificacoes();
DROP FUNCTION IF EXISTS public.validar_referencia_notificacao_vaga();

ALTER TABLE public.candidaturas
  DROP CONSTRAINT candidaturas_vaga_id_fkey,
  ADD CONSTRAINT candidaturas_vaga_id_fkey
    FOREIGN KEY (vaga_id) REFERENCES public.vagas(id) ON DELETE CASCADE;
ALTER TABLE public.avaliacoes
  DROP CONSTRAINT avaliacoes_vaga_id_fkey,
  ADD CONSTRAINT avaliacoes_vaga_id_fkey
    FOREIGN KEY (vaga_id) REFERENCES public.vagas(id) ON DELETE CASCADE;
ALTER TABLE public.denuncias
  DROP CONSTRAINT denuncias_vaga_id_fkey,
  ADD CONSTRAINT denuncias_vaga_id_fkey
    FOREIGN KEY (vaga_id) REFERENCES public.vagas(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS vagas_no_owner_delete ON public.vagas;
CREATE POLICY vagas_delete_auth
  ON public.vagas FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT c.id FROM public.companies c WHERE c.user_id = (SELECT auth.uid())
    )
  );

COMMIT;
