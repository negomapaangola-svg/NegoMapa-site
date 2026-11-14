-- Versiona no repositório duas definições que existiam em produção sem migração.
-- Corpo e grants copiados do estado real observado em produção (pg_get_functiondef
-- e routine_privileges). Não altera comportamento: CREATE OR REPLACE com o mesmo corpo
-- e os mesmos privilégios efectivos. Não aplicar sem autorização explícita.

BEGIN;

-- 1. Perfil do profissional autenticado (lê apenas a linha de auth.uid()).
CREATE OR REPLACE FUNCTION public.get_my_profissional_profile()
 RETURNS TABLE(id uuid, nome text, telefone text, whatsapp text, bio text, provincia text, municipio text, estado text, motivo_rejeicao text, slug text, avatar_url text, anos_experiencia smallint, disponibilidade_dias text[], disponibilidade_horarios jsonb, portfolio jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
      p.id, p.nome, p.telefone, p.whatsapp, p.bio, p.provincia, p.municipio,
      p.estado, p.motivo_rejeicao, p.slug, p.avatar_url, p.anos_experiencia,
      p.disponibilidade_dias, p.disponibilidade_horarios, p.portfolio
    FROM public.profissionais p
   WHERE p.user_id = auth.uid()
$function$;

REVOKE ALL ON FUNCTION public.get_my_profissional_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profissional_profile() TO authenticated, service_role;

-- 2. Verificação de imagem pública aprovada, usada pela política de Storage
-- "imagens_publicas_aprovadas" (SELECT para anon e authenticated).
-- anon mantém EXECUTE porque a política de Storage é avaliada para anon.
CREATE OR REPLACE FUNCTION public.imagem_publica_aprovada(p_bucket text, p_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT CASE p_bucket
    WHEN 'profissionais-avatars' THEN EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.estado = 'aprovado' AND strpos(COALESCE(p.avatar_url, ''), p_name) > 0)
    WHEN 'profissionais-portfolio' THEN EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.estado = 'aprovado' AND strpos(COALESCE(p.portfolio::text, ''), p_name) > 0)
    WHEN 'empresas-logos' THEN EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.is_approved = true AND strpos(COALESCE(c.logo_url, ''), p_name) > 0)
    ELSE false
  END;
$function$;

REVOKE ALL ON FUNCTION public.imagem_publica_aprovada(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imagem_publica_aprovada(text, text) TO anon, authenticated, service_role;

COMMIT;
