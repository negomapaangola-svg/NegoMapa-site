-- =====================================================================
-- REVERSÃO — colunas de contacto e de página na vista pública (migração 20261102230000)
-- Repõe a definição da vista como estava em 20261102220000: 9 colunas, mesmos grants.
-- Não toca em tabelas, políticas nem dados.
-- Nota: CREATE OR REPLACE não remove colunas, por isso a vista é recriada.
-- =====================================================================

BEGIN;

DROP VIEW IF EXISTS public.profissionais_publicos;

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
