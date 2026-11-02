-- =====================================================================
-- Administração de profissionais: categoria na listagem e estado 'suspenso'
-- NegóMapa — PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Aplicar só com autorização explícita e após validação (ver pontos de validação
-- no relatório da Tarefa 9). Reversão: supabase/rollback/20261102130000_admin_profissionais_reversao.sql
--
-- Alterações:
--   1. profissionais_estado_check passa a aceitar 'suspenso'.
--      ÚNICA alteração de tabela: não toca em colunas, políticas nem dados.
--   2. admin_listar_profissionais() passa a devolver a coluna categoria
--      (categorias.nome, via categoria_id). Restantes colunas e ordem mantidas.
--   3. admin_avaliar_profissional() aceita 'suspenso' além de pendente, aprovado
--      e rejeitado. A rejeição continua a exigir motivo (mín. 10 caracteres).
--      Suspensão e aprovação gravam motivo_rejeicao = NULL.
--   Em ambas as RPCs: is_admin() continua a ser a verificação; EXECUTE só para
--   authenticated e service_role (nunca PUBLIC nem anon).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. CHECK do estado: acrescenta 'suspenso'.
--    Não há linhas com 'suspenso' antes desta migração, por isso a validação passa.
-- ---------------------------------------------------------------------
ALTER TABLE public.profissionais DROP CONSTRAINT profissionais_estado_check;
ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_estado_check
  CHECK (estado = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'suspenso'::text]));

-- ---------------------------------------------------------------------
-- 2. admin_listar_profissionais: acrescenta categoria.
--    O tipo de retorno muda (nova coluna), por isso é preciso DROP antes de CREATE.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_listar_profissionais();

CREATE FUNCTION public.admin_listar_profissionais()
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
  avaliado_em timestamptz,
  categoria text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar profissionais';
  END IF;

  RETURN QUERY
    SELECT p.id, p.nome, p.estado, p.provincia, p.municipio, p.whatsapp,
           p.slug, p.created_at, p.motivo_rejeicao, p.avaliado_em,
           c.nome AS categoria
      FROM public.profissionais p
      LEFT JOIN public.categorias c ON c.id = p.categoria_id
     ORDER BY p.created_at DESC;
END
$f$;

REVOKE ALL ON FUNCTION public.admin_listar_profissionais() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listar_profissionais() TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. admin_avaliar_profissional: aceita 'suspenso'; rejeição mantém motivo obrigatório.
--    Mesma assinatura: CREATE OR REPLACE mantém o dono; os grants são repostos abaixo.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_avaliar_profissional(
  p_id uuid,
  p_estado text,
  p_motivo text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem avaliar profissionais';
  END IF;

  IF p_estado NOT IN ('pendente', 'aprovado', 'rejeitado', 'suspenso') THEN
    RAISE EXCEPTION 'Estado inválido';
  END IF;

  IF p_estado = 'rejeitado' AND (p_motivo IS NULL OR length(btrim(p_motivo)) < 10) THEN
    RAISE EXCEPTION 'O motivo da rejeição é obrigatório (mínimo 10 caracteres)';
  END IF;

  UPDATE public.profissionais
     SET estado = p_estado,
         motivo_rejeicao = CASE WHEN p_estado = 'rejeitado' THEN btrim(p_motivo) ELSE NULL END,
         avaliado_em = now(),
         avaliado_por = auth.uid()
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;
END
$f$;

REVOKE ALL ON FUNCTION public.admin_avaliar_profissional(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_avaliar_profissional(uuid, text, text) TO authenticated, service_role;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) has_function_privilege('anon','public.admin_listar_profissionais()','EXECUTE') -> false
--   b) has_function_privilege('anon','public.admin_avaliar_profissional(uuid,text,text)','EXECUTE') -> false
--   c) select pg_get_constraintdef(oid) from pg_constraint where conname='profissionais_estado_check' -> inclui 'suspenso'
--   d) select * from public.admin_listar_profissionais() como admin -> coluna categoria presente
-- ---------------------------------------------------------------------
