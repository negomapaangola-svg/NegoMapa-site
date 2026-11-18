-- FASE 2 — impedir a eliminação de vagas e preservar o histórico relacionado.
-- O encerramento (encerrada_em) é o mecanismo normal de retirada.
-- A migração é aditiva em dados: não elimina nem reescreve registos existentes.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.vagas') IS NULL
     OR to_regclass('public.candidaturas') IS NULL
     OR to_regclass('public.avaliacoes') IS NULL
     OR to_regclass('public.denuncias') IS NULL
     OR to_regclass('public.notificacoes') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'vagas'
         AND policyname = 'vagas_delete_auth' AND cmd = 'DELETE'
     ) THEN
    RAISE EXCEPTION 'FASE 2: esquema/política de eliminação inesperados; migração cancelada';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.candidaturas'::regclass
      AND conname <> 'candidaturas_vaga_id_fkey'
      AND confrelid = 'public.vagas'::regclass
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.candidaturas'::regclass
      AND conname = 'candidaturas_vaga_id_fkey'
      AND confdeltype = 'c'
  ) THEN
    RAISE EXCEPTION 'FASE 2: FK de candidaturas inesperada; migração cancelada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.avaliacoes'::regclass
      AND conname = 'avaliacoes_vaga_id_fkey'
      AND confdeltype = 'c'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.denuncias'::regclass
      AND conname = 'denuncias_vaga_id_fkey'
      AND confdeltype = 'c'
  ) THEN
    RAISE EXCEPTION 'FASE 2: FKs de avaliações/denúncias inesperadas; migração cancelada';
  END IF;
END
$$;

-- RLS: a política restritiva prevalece sobre qualquer política permissiva
-- existente, impedindo DELETE directo pela API por parte do proprietário.
DROP POLICY vagas_delete_auth ON public.vagas;
CREATE POLICY vagas_no_owner_delete
  ON public.vagas AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = vagas.company_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

-- Mesmo um DELETE administrativo não pode apagar o histórico ligado à vaga.
-- RESTRICT evita que uma operação de eliminação em cascata destrua registos.
ALTER TABLE public.candidaturas
  DROP CONSTRAINT candidaturas_vaga_id_fkey,
  ADD CONSTRAINT candidaturas_vaga_id_fkey
    FOREIGN KEY (vaga_id) REFERENCES public.vagas(id) ON DELETE RESTRICT;
ALTER TABLE public.avaliacoes
  DROP CONSTRAINT avaliacoes_vaga_id_fkey,
  ADD CONSTRAINT avaliacoes_vaga_id_fkey
    FOREIGN KEY (vaga_id) REFERENCES public.vagas(id) ON DELETE RESTRICT;
ALTER TABLE public.denuncias
  DROP CONSTRAINT denuncias_vaga_id_fkey,
  ADD CONSTRAINT denuncias_vaga_id_fkey
    FOREIGN KEY (vaga_id) REFERENCES public.vagas(id) ON DELETE RESTRICT;

-- referencia_id é polimórfica. Para notificações de vaga, validar a referência
-- na escrita e impedir a eliminação da vaga enquanto existir histórico associado.
CREATE OR REPLACE FUNCTION public.validar_referencia_notificacao_vaga()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF NEW.tipo IN ('vaga_aprovada', 'vaga_rejeitada') THEN
    IF NEW.referencia_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.vagas v WHERE v.id = NEW.referencia_id
    ) THEN
      RAISE EXCEPTION 'Notificação de vaga exige uma referência válida'
        USING ERRCODE = '23503',
              CONSTRAINT = 'notificacoes_referencia_vaga_fkey';
    END IF;
  END IF;
  RETURN NEW;
END
$function$;

CREATE TRIGGER trg_validar_referencia_notificacao_vaga
  BEFORE INSERT OR UPDATE OF tipo, referencia_id
  ON public.notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_referencia_notificacao_vaga();

CREATE OR REPLACE FUNCTION public.impedir_eliminacao_vaga_com_notificacoes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.notificacoes n
    WHERE n.referencia_id = OLD.id
      AND n.tipo IN ('vaga_aprovada', 'vaga_rejeitada')
  ) THEN
    RAISE EXCEPTION 'A vaga tem notificações históricas; encerre-a em vez de a eliminar'
      USING ERRCODE = '23503',
            CONSTRAINT = 'vagas_notificacoes_historico_fkey';
  END IF;
  RETURN OLD;
END
$function$;

CREATE TRIGGER trg_preservar_notificacoes_vaga
  BEFORE DELETE ON public.vagas
  FOR EACH ROW
  EXECUTE FUNCTION public.impedir_eliminacao_vaga_com_notificacoes();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vagas'
      AND policyname = 'vagas_delete_auth'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vagas'
      AND policyname = 'vagas_no_owner_delete'
      AND permissive = 'RESTRICTIVE' AND cmd = 'DELETE'
  ) THEN
    RAISE EXCEPTION 'FASE 2: política de bloqueio do proprietário não ficou activa';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid IN ('public.candidaturas'::regclass,
                       'public.avaliacoes'::regclass,
                       'public.denuncias'::regclass)
      AND confrelid = 'public.vagas'::regclass
      AND confdeltype <> 'r'
  ) THEN
    RAISE EXCEPTION 'FASE 2: existe FK de histórico de vaga que não usa RESTRICT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.notificacoes'::regclass
      AND tgname = 'trg_validar_referencia_notificacao_vaga'
      AND NOT tgisinternal
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.vagas'::regclass
      AND tgname = 'trg_preservar_notificacoes_vaga'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'FASE 2: protecção de notificações não ficou activa';
  END IF;
END
$$;

COMMIT;
