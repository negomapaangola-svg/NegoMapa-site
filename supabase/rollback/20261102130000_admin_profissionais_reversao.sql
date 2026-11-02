-- =====================================================================
-- REVERSÃO — administração de profissionais (migração 20261102130000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- Restaura as definições que existiam em produção antes da migração (lidas a 2 de novembro de 2026):
--   - admin_listar_profissionais(): 10 colunas, sem categoria
--   - admin_avaliar_profissional(): aceita apenas pendente, aprovado, rejeitado
--   - profissionais_estado_check: apenas pendente, aprovado, rejeitado
-- Não altera dados, colunas nem políticas.
--
-- ATENÇÃO: se existirem profissionais com estado 'suspenso', a reversão da CHECK
-- falha de propósito. Decidir antes o que fazer a esses registos
-- (não os altera esta reversão).
-- =====================================================================

BEGIN;

-- 0. Verificação prévia: não reverter com registos que a CHECK antiga não aceita.
DO $pre$
DECLARE
  v_n integer;
BEGIN
  SELECT count(*)::integer INTO v_n FROM public.profissionais WHERE estado = 'suspenso';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Reversão cancelada: % profissional(is) com estado suspenso. Decidir o tratamento antes.', v_n;
  END IF;
END
$pre$;

-- 1. admin_avaliar_profissional: definição original.
CREATE OR REPLACE FUNCTION public.admin_avaliar_profissional(p_id uuid, p_estado text, p_motivo text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem avaliar profissionais';
  END IF;
  IF p_estado NOT IN ('pendente', 'aprovado', 'rejeitado') THEN
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
$function$;

REVOKE ALL ON FUNCTION public.admin_avaliar_profissional(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_avaliar_profissional(uuid, text, text) TO authenticated, service_role;

-- 2. admin_listar_profissionais: definição original (sem categoria).
DROP FUNCTION IF EXISTS public.admin_listar_profissionais();

CREATE FUNCTION public.admin_listar_profissionais()
RETURNS TABLE(id uuid, nome text, estado text, provincia text, municipio text, whatsapp text, slug text, created_at timestamp with time zone, motivo_rejeicao text, avaliado_em timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION public.admin_listar_profissionais() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listar_profissionais() TO authenticated, service_role;

-- 3. CHECK do estado: volta a aceitar apenas pendente, aprovado, rejeitado.
ALTER TABLE public.profissionais DROP CONSTRAINT profissionais_estado_check;
ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_estado_check
  CHECK ((estado = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text])));

COMMIT;
