-- Protege o campo estado de servicos, vagas e profissionais.
-- Utilizadores comuns não podem alterar estado; novos registos ficam 'pendente'.
-- Apenas administradores (public.is_admin(), baseado em admin_users) podem alterar estado.
-- Aplicado em produção e validado com RLS real (transacções revertidas antes da aplicação).
--
-- Reversão:
--   DROP TRIGGER IF EXISTS trg_proteger_estado_servicos ON public.servicos;
--   DROP TRIGGER IF EXISTS trg_proteger_estado_vagas ON public.vagas;
--   DROP TRIGGER IF EXISTS trg_proteger_estado_profissionais ON public.profissionais;
--   DROP FUNCTION IF EXISTS public.proteger_estado();

CREATE OR REPLACE FUNCTION public.proteger_estado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.estado := 'pendente'; RETURN NEW; END IF;
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o estado';
  END IF;
  RETURN NEW;
END $function$;

REVOKE ALL ON FUNCTION public.proteger_estado() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_proteger_estado_servicos
  BEFORE INSERT OR UPDATE ON public.servicos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_estado();

CREATE TRIGGER trg_proteger_estado_vagas
  BEFORE INSERT OR UPDATE ON public.vagas
  FOR EACH ROW EXECUTE FUNCTION public.proteger_estado();

CREATE TRIGGER trg_proteger_estado_profissionais
  BEFORE INSERT OR UPDATE ON public.profissionais
  FOR EACH ROW EXECUTE FUNCTION public.proteger_estado();
