-- =====================================================================
-- REVERSÃO — vista pública de profissionais (migração 20261102220000)
-- Remove apenas a vista public.profissionais_publicos.
-- Não toca em tabelas, colunas, políticas, grants de tabela nem dados.
-- =====================================================================

BEGIN;

DROP VIEW IF EXISTS public.profissionais_publicos;

COMMIT;
