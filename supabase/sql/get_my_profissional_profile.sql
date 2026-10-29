-- Função para o dono ler o próprio perfil profissional, incluindo telefone.
-- Rascunho para revisão. NÃO aplicar antes de:
--   1) testes desta função passarem (ver testes_get_my_profissional_profile.sql);
--   2) getUserProfile() usar esta função (alteração em src/lib/actions/servicos.ts);
--   3) só depois, aplicar a migração 20261029_restringir_colunas_publicas_profissionais.sql.
--
-- Segurança:
--   - Não recebe parâmetros: só devolve a linha cujo user_id = auth.uid().
--     Não é possível pedir o perfil de outra pessoa.
--   - Não devolve bi_numero, user_id nem updated_at.
--   - anon não tem EXECUTE.
--
-- Reversão:
--   DROP FUNCTION IF EXISTS public.get_my_profissional_profile();

CREATE OR REPLACE FUNCTION public.get_my_profissional_profile()
RETURNS TABLE (
  id                       uuid,
  nome                     text,
  telefone                 text,
  whatsapp                 text,
  bio                      text,
  provincia                text,
  municipio                text,
  estado                   text,
  slug                     text,
  avatar_url               text,
  anos_experiencia         smallint,
  disponibilidade_dias     text[],
  disponibilidade_horarios jsonb,
  portfolio                jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT
    p.id, p.nome, p.telefone, p.whatsapp, p.bio, p.provincia, p.municipio,
    p.estado, p.slug, p.avatar_url, p.anos_experiencia,
    p.disponibilidade_dias, p.disponibilidade_horarios, p.portfolio
  FROM public.profissionais p
  WHERE p.user_id = auth.uid()
$f$;

REVOKE ALL ON FUNCTION public.get_my_profissional_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profissional_profile() TO authenticated;
