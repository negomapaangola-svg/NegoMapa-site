-- =====================================================================
-- REVERSÃO — perfil público da empresa (migração 20261103120000)
-- Repõe a vista empresas_publicas com as 13 colunas anteriores, os grants
-- anteriores da vista, o grant de documento_legalizacao_url ao anon e remove
-- os grants novos. Remove também a coluna companies.portfolio.
--
-- ATENÇÃO: remover a coluna apaga o conteúdo de portfolio, se já tiver sido preenchido.
-- =====================================================================

BEGIN;

-- Vista: DROP + CREATE, porque CREATE OR REPLACE não remove colunas.
DROP VIEW IF EXISTS public.empresas_publicas;

CREATE VIEW public.empresas_publicas
WITH (security_invoker = true) AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.sector,
  c.province,
  c.city,
  c.bairro,
  c.rua,
  c.referencia_localizacao,
  c.description,
  c.horario_atendimento,
  c.is_verified,
  c.is_approved
FROM public.companies c;

COMMENT ON VIEW public.empresas_publicas IS
  'Leitura pública de empresas. security_invoker: RLS e privilégios de coluna do chamador. Não expõe NIF, documentos nem WhatsApp.';

REVOKE ALL ON public.empresas_publicas FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.empresas_publicas TO anon, authenticated;

-- Grants de colunas novas removidos e grant anterior reposto.
REVOKE SELECT (whatsapp, logo_url, portfolio) ON public.companies FROM anon;
GRANT SELECT (documento_legalizacao_url) ON public.companies TO anon;

-- Coluna nova (apaga o conteúdo de portfolio, se existir).
ALTER TABLE public.companies DROP COLUMN IF EXISTS portfolio;

COMMIT;
