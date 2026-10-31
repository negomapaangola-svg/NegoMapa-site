-- =====================================================================
-- PROPOSTA B.6.24 — NÃO APLICAR. Para revisão e autorização explícita.
-- Projeto: sjelyaewgcmmtnudcgem
-- Objetivo: expor motivo_rejeicao ao dono e ao admin, sem conceder
-- SELECT geral à coluna a authenticated.
-- Verificado em leitura (31/10/2026): nenhuma view ou função depende de
-- get_my_profissional_profile (pg_depend sem linhas); só getUserProfile
-- (src/lib/actions/servicos.ts) a chama.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. DONO: get_my_profissional_profile devolve motivo_rejeicao.
--    Alterar o tipo de retorno exige DROP (CREATE OR REPLACE não muda
--    o tipo de linha). Mantém SECURITY DEFINER, search_path vazio e
--    filtro por auth.uid(): o dono só recebe a sua própria linha.
--    A coluna avaliado_por (uuid do admin) NÃO é exposta.
-- ---------------------------------------------------------------------
DROP FUNCTION public.get_my_profissional_profile();

CREATE FUNCTION public.get_my_profissional_profile()
RETURNS TABLE(
  id uuid,
  nome text,
  telefone text,
  whatsapp text,
  bio text,
  provincia text,
  municipio text,
  estado text,
  motivo_rejeicao text,
  slug text,
  avatar_url text,
  anos_experiencia smallint,
  disponibilidade_dias text[],
  disponibilidade_horarios jsonb,
  portfolio jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $f$
  SELECT
    p.id, p.nome, p.telefone, p.whatsapp, p.bio, p.provincia, p.municipio,
    p.estado, p.motivo_rejeicao, p.slug, p.avatar_url, p.anos_experiencia,
    p.disponibilidade_dias, p.disponibilidade_horarios, p.portfolio
  FROM public.profissionais p
  WHERE p.user_id = auth.uid()
$f$;

-- Mesmas permissões que a função original (authenticated e service_role; sem anon).
REVOKE ALL ON FUNCTION public.get_my_profissional_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profissional_profile() TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2. ADMIN: nova RPC de listagem. Não concede SELECT em motivo_rejeicao
--    a authenticated; a leitura faz-se numa função SECURITY DEFINER que
--    verifica is_admin() antes de devolver qualquer linha.
--    Não altera RLS nem grants existentes; admin_avaliar_profissional
--    continua igual.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_listar_profissionais()
RETURNS TABLE(
  id uuid,
  nome text,
  estado text,
  provincia text,
  municipio text,
  whatsapp text,
  slug text,
  created_at timestamptz,
  motivo_rejeicao text,
  avaliado_em timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $f$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar profissionais';
  END IF;
  RETURN QUERY
    SELECT p.id, p.nome, p.estado, p.provincia, p.municipio, p.whatsapp,
           p.slug, p.created_at, p.motivo_rejeicao, p.avaliado_em
    FROM public.profissionais p
    ORDER BY p.created_at DESC;
END
$f$;

REVOKE ALL ON FUNCTION public.admin_listar_profissionais() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listar_profissionais() TO authenticated;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura, para correr como postgres e
-- como utilizador comum em transação com SET LOCAL ROLE):
--   a) select motivo_rejeicao from get_my_profissional_profile();  -- dono: ok
--   b) select has_column_privilege('authenticated','public.profissionais','motivo_rejeicao','SELECT');
--      -- esperado: false (não concedido)
--   c) anon: select * from admin_listar_profissionais();  -- esperado: permission denied
--   d) não-admin autenticado: select * from admin_listar_profissionais();  -- esperado: exceção
--   e) admin: select * from admin_listar_profissionais();  -- esperado: todas as linhas
-- ---------------------------------------------------------------------
