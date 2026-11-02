-- =====================================================================
-- Vista pública de profissionais aprovados — NegóMapa
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102220000_profissionais_publicos_reversao.sql
--
-- Âmbito: cria apenas a vista public.profissionais_publicos.
-- Não altera tabelas, colunas, políticas, grants de tabela, dados nem storage.
--
-- Colunas expostas (só estas): id, nome, slug, categoria_id, categoria (nome da
-- área principal, via categoria_id), provincia, municipio, anos_experiencia, bio.
-- Não expõe: telefone, whatsapp, bi_numero, bi_foto_path, avatar_url, portfolio,
-- disponibilidade, user_id, motivo_rejeicao, avaliado_em, avaliado_por, updated_at.
--
-- security_invoker = true: a vista corre com os privilégios do chamador (anon ou
-- authenticated). Só funciona porque anon e authenticated já têm SELECT nas colunas
-- usadas; a RLS de profissionais e categorias continua a aplicar-se.
-- Filtro obrigatório: estado = 'aprovado'.
-- =====================================================================

BEGIN;

CREATE VIEW public.profissionais_publicos
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.nome,
  p.slug,
  p.categoria_id,
  c.nome AS categoria,
  p.provincia,
  p.municipio,
  p.anos_experiencia,
  p.bio
FROM public.profissionais p
LEFT JOIN public.categorias c ON c.id = p.categoria_id
WHERE p.estado = 'aprovado';

COMMENT ON VIEW public.profissionais_publicos IS
  'Leitura pública de profissionais aprovados, só com colunas seguras. Sem contactos diretos, BI, portfólio nem dados de moderação.';

REVOKE ALL ON public.profissionais_publicos FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profissionais_publicos TO anon, authenticated;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) select count(*) from public.profissionais_publicos -> igual ao número de profissionais aprovados
--   b) has_table_privilege('anon','public.profissionais_publicos','SELECT') -> true
--   c) Nenhuma coluna sensível: information_schema.columns da vista não contém telefone, whatsapp, bi_*, user_id
-- ---------------------------------------------------------------------
