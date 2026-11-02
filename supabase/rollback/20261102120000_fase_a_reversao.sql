-- =============================================================================
-- REVERSÃO DA FASE A — NegóMapa
-- NÃO APLICADA. Executar só se a Fase A tiver sido aplicada e for preciso
-- voltar atrás.
--
-- Remove apenas objetos criados pela Fase A: duas vistas e duas funções.
-- Os grants de objetos existentes não foram alterados pela Fase A, por isso
-- não há grants a repor. Não altera dados nem políticas.
-- =============================================================================

DROP VIEW IF EXISTS public.vagas_publicas;
DROP VIEW IF EXISTS public.empresas_publicas;

DROP FUNCTION IF EXISTS public.obter_contacto_candidatura(uuid);
DROP FUNCTION IF EXISTS public.obter_minha_empresa();
