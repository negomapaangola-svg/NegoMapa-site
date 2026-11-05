-- =====================================================================
-- Bloqueio de início de conversas com profissionais e de pedidos de serviço por contas
-- de profissional — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261103100000_bloquear_inicio_profissionais_reversao.sql
--
-- Regra final (Opção A):
--   - Um utilizador com perfil de profissional (qualquer estado) NÃO pode criar conversas
--     com profissionais (profissional_id IS NOT NULL).
--   - Um utilizador com perfil de profissional NÃO pode criar pedidos de serviço.
--   - Um utilizador com perfil de profissional PODE criar conversas com empresas
--     (empresa_id IS NOT NULL), incluindo no fluxo de candidaturas.
--   - Continua a poder responder a conversas existentes (políticas de mensagens inalteradas).
--
-- Altera apenas:
--   - nova função public.utilizador_e_profissional() (SECURITY DEFINER, search_path vazio);
--   - política conversas_insert_cliente (acrescenta NOT (profissional_id IS NOT NULL AND
--     utilizador_e_profissional())). Restantes condições mantidas à letra.
--   - política pedidos_servico_insert_cliente (acrescenta NOT utilizador_e_profissional()).
--     Restantes condições mantidas à letra.
-- Não altera tabelas, colunas, dados, mensagens, candidaturas nem outras políticas.
-- =====================================================================

BEGIN;

CREATE FUNCTION public.utilizador_e_profissional()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT EXISTS (SELECT 1 FROM public.profissionais p WHERE p.user_id = auth.uid())
$f$;

REVOKE ALL ON FUNCTION public.utilizador_e_profissional() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.utilizador_e_profissional() TO authenticated;

-- ---------------------------------------------------------------------
-- conversas: perfil de profissional não inicia conversa com profissional;
-- continua a poder iniciar conversa com empresa aprovada.
-- ---------------------------------------------------------------------
DROP POLICY conversas_insert_cliente ON public.conversas;

CREATE POLICY conversas_insert_cliente ON public.conversas
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT (profissional_id IS NOT NULL AND (SELECT public.utilizador_e_profissional()))
    AND cliente_id = (SELECT auth.uid())
    AND (empresa_id IS NULL OR empresa_id NOT IN (
          SELECT e.id FROM public.companies e WHERE e.user_id = (SELECT auth.uid())))
    AND (profissional_id IS NULL OR profissional_id NOT IN (
          SELECT p.id FROM public.profissionais p WHERE p.user_id = (SELECT auth.uid())))
    AND (
      (profissional_id IS NOT NULL AND public.perfil_profissional_aprovado(profissional_id))
      OR (empresa_id IS NOT NULL AND public.empresa_aprovada(empresa_id))
    )
  );

-- ---------------------------------------------------------------------
-- pedidos_servico: perfil de profissional não cria pedidos de serviço
-- ---------------------------------------------------------------------
DROP POLICY pedidos_servico_insert_cliente ON public.pedidos_servico;

CREATE POLICY pedidos_servico_insert_cliente ON public.pedidos_servico
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT (SELECT public.utilizador_e_profissional())
    AND cliente_id = (SELECT auth.uid())
    AND estado = 'novo'
    AND (profissional_id IS NULL OR public.profissional_aprovado(profissional_id))
  );

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura ou em transação com ROLLBACK):
--   a) Perfil de profissional: INSERT em conversas com profissional_id -> recusado (42501)
--   b) Perfil de profissional: INSERT em conversas com empresa_id (candidatura) -> aceite
--   c) Perfil de profissional: INSERT em pedidos_servico -> recusado (42501)
--   d) Utilizador sem perfil de profissional: INSERT em conversas com profissional aprovado -> aceite
--   e) Utilizador sem perfil de profissional: INSERT em pedidos_servico -> aceite
--   f) Profissional responde numa conversa existente em que participa -> aceite
--   g) has_function_privilege('anon','public.utilizador_e_profissional()','EXECUTE') -> false
-- ---------------------------------------------------------------------
