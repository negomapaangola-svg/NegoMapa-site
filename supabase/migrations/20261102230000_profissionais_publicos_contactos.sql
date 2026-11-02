-- =====================================================================
-- Vista pública de profissionais: colunas de contacto e de página — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102230000_profissionais_publicos_contactos_reversao.sql
--
-- Âmbito: acrescenta colunas ao FIM da vista public.profissionais_publicos, para que
-- /servicos e /servico/[slug] leiam o profissional só pela vista, sem embed da tabela.
-- Colunas acrescentadas (todas já têm SELECT para anon): whatsapp (contacto público por
-- decisão de produto), avatar_url, portfolio, disponibilidade_dias, disponibilidade_horarios,
-- especialidades, experiencia_faixa, faixa_preco_desde.
-- Não acrescenta: telefone, bairro, created_at, bi_*, user_id, moderação.
--
-- CREATE OR REPLACE mantém as colunas existentes, a ordem e os grants da vista.
-- Não altera tabelas, políticas, grants de tabela nem dados.
-- =====================================================================

BEGIN;

CREATE OR REPLACE VIEW public.profissionais_publicos
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
  p.bio,
  p.whatsapp,
  p.avatar_url,
  p.portfolio,
  p.disponibilidade_dias,
  p.disponibilidade_horarios,
  p.especialidades,
  p.experiencia_faixa,
  p.faixa_preco_desde
FROM public.profissionais p
LEFT JOIN public.categorias c ON c.id = p.categoria_id
WHERE p.estado = 'aprovado';

COMMENT ON VIEW public.profissionais_publicos IS
  'Leitura pública de profissionais aprovados, só com colunas seguras. Sem telefone, BI, bairro, data de criação nem dados de moderação.';

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) select count(*) from public.profissionais_publicos -> igual ao número de profissionais aprovados
--   b) has_table_privilege('anon','public.profissionais_publicos','SELECT') -> true
--   c) Colunas da vista não contêm telefone, bairro, created_at, bi_*, user_id
-- ---------------------------------------------------------------------
