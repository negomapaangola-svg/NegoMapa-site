-- Função segura para o dono ler apenas o próprio BI (profissionais.bi_numero).
-- Aplicado em produção. Não altera grants de tabela nem de coluna.
-- Anónimo não consegue executar; cada utilizador autenticado só obtém o seu BI.
--
-- Reversão:
--   DROP FUNCTION IF EXISTS public.obter_bi_proprio();

CREATE OR REPLACE FUNCTION public.obter_bi_proprio()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT p.bi_numero FROM public.profissionais p WHERE p.user_id = auth.uid()
$f$;

REVOKE ALL ON FUNCTION public.obter_bi_proprio() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obter_bi_proprio() TO authenticated;
