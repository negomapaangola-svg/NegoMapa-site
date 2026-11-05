-- =====================================================================
-- Perfil público da empresa — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261103120000_perfil_publico_empresa_reversao.sql
--
-- ATENÇÃO: não aplicar antes de a página /empresa/[slug] deixar de ler
-- companies.documento_legalizacao_url. Depois do REVOKE abaixo, essa leitura falha
-- para visitantes anónimos e a página mostra "Empresa não encontrada".
--
-- Altera apenas:
--   1. GRANT SELECT (whatsapp, logo_url, portfolio) em companies ao papel anon.
--   2. Nova coluna companies.portfolio jsonb DEFAULT '[]'.
--   3. (incluído em 1) portfolio legível por anon.
--   4. REVOKE SELECT (documento_legalizacao_url) em companies ao papel anon.
--   5. Vista empresas_publicas com whatsapp, logo_url e portfolio (mesmas colunas
--      anteriores, acrescentadas no fim).
--   6. Vista só com empresas aprovadas (WHERE is_approved = true). A RLS
--      anon_select_approved_companies já limita a isto; o filtro torna-o explícito.
--
-- Não altera outras tabelas, políticas, rotas, páginas nem componentes.
-- =====================================================================

BEGIN;

-- 2. Nova coluna de portfólio (jsonb, default lista vazia)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS portfolio jsonb DEFAULT '[]'::jsonb;

-- 1 e 3. Leitura pública de whatsapp, logo_url e portfolio
GRANT SELECT (whatsapp, logo_url, portfolio) ON public.companies TO anon;

-- 4. Deixar de expor o documento de legalização a visitantes anónimos
REVOKE SELECT (documento_legalizacao_url) ON public.companies FROM anon;

-- 5 e 6. Vista pública: colunas acrescentadas no fim e filtro explícito de aprovadas.
-- CREATE OR REPLACE mantém os grants existentes da vista (anon, authenticated).
CREATE OR REPLACE VIEW public.empresas_publicas
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
  c.is_approved,
  c.whatsapp,
  c.logo_url,
  c.portfolio
FROM public.companies c
WHERE c.is_approved = true;

COMMENT ON VIEW public.empresas_publicas IS
  'Leitura pública de empresas aprovadas. security_invoker: RLS e privilégios de coluna do chamador. Não expõe NIF, documentos de legalização nem dados de moderação.';

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) anon: SELECT whatsapp, logo_url, portfolio FROM companies -> permitido
--   b) anon: SELECT documento_legalizacao_url FROM companies -> erro 42501
--   c) anon: SELECT * FROM empresas_publicas -> só is_approved = true
--   d) has_column_privilege('anon','public.companies','nif','SELECT') -> false
--   e) Listagem /empresas e página /empresa/[slug] (depois da alteração de código)
-- ---------------------------------------------------------------------
