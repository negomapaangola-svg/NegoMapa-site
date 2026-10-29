-- ============================================================================
-- Migração: restringir colunas da tabela public.companies (anon e authenticated)
-- Projeto: NegóMapa
-- Estado: PREPARADA, NÃO APLICADA. Para revisão antes de aplicar.
--
-- Objetivo:
--   - anon: deixa de conseguir ler nif, user_id, documents_url e whatsapp.
--   - authenticated: deixa de conseguir ler nif, documents_url e whatsapp.
--     Mantém user_id, porque os fluxos de dono e admin filtram por user_id.
--   - service_role: sem alterações (acesso total mantido).
--
-- Âmbito: apenas privilégios SELECT. Não altera políticas RLS, INSERT,
-- UPDATE, DELETE, funções, triggers nem dados.
--
-- Nota sobre RLS: as linhas continuam filtradas pelas políticas existentes
-- (anon vê só aprovadas; authenticated vê aprovadas e as próprias).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. REVOKE: remover o SELECT ao nível da tabela inteira
-- ----------------------------------------------------------------------------
-- Sem este REVOKE, o grant de tabela continua a dar acesso a TODAS as colunas,
-- e os GRANTs por coluna abaixo não restringem nada.
REVOKE SELECT ON TABLE public.companies FROM anon;
REVOKE SELECT ON TABLE public.companies FROM authenticated;


-- ----------------------------------------------------------------------------
-- 2. GRANT anon: apenas colunas públicas (listagem /empresas e detalhe /empresa/[slug])
-- ----------------------------------------------------------------------------
-- Excluídas de propósito: nif, user_id, documents_url, whatsapp.
-- Decisões de produto pendentes (incluídas porque o detalhe público as usa hoje):
--   - email, phone: contacto direto mostrado em /empresa/[slug].
--   - documento_legalizacao_url: link mostrado em /empresa/[slug].
-- is_approved é necessária porque o filtro .eq("is_approved", true) lê a coluna.
GRANT SELECT (
  id,
  name,
  slug,
  sector,
  province,
  city,
  bairro,
  rua,
  referencia_localizacao,
  description,
  email,
  phone,
  horario_atendimento,
  estado_legalizacao,
  documento_legalizacao_url,
  is_approved
) ON TABLE public.companies TO anon;


-- ----------------------------------------------------------------------------
-- 3. GRANT authenticated: mesmas colunas públicas + user_id
-- ----------------------------------------------------------------------------
-- user_id mantém-se, porque os fluxos de dono (cadastrar-empresa, painel de vagas)
-- e admin (getAllEmpresasAdmin) filtram ou leem por user_id.
-- created_at mantém-se, porque o painel /admin/empresas lê e ordena por created_at.
-- Só SELECT: não há INSERT, UPDATE nem DELETE concedidos em created_at.
-- Excluídas de propósito: nif, documents_url, whatsapp.
-- Nota: utilizadores autenticados continuam a ler estas colunas de todas as
-- empresas aprovadas, como já acontece hoje.
GRANT SELECT (
  id,
  name,
  slug,
  sector,
  province,
  city,
  bairro,
  rua,
  referencia_localizacao,
  description,
  email,
  phone,
  horario_atendimento,
  estado_legalizacao,
  documento_legalizacao_url,
  is_approved,
  created_at,
  user_id
) ON TABLE public.companies TO authenticated;


-- ----------------------------------------------------------------------------
-- 4. service_role: acesso total mantido
-- ----------------------------------------------------------------------------
-- Idempotente: se o grant já existir, não altera nada. Não mexe em outros
-- privilégios (INSERT, UPDATE, DELETE) do service_role.
GRANT SELECT ON TABLE public.companies TO service_role;


-- ============================================================================
-- VERIFICAÇÃO (só leitura, para revisão após aplicar; não executar como parte
-- da migração):
--
--   SELECT grantee, privilege_type, string_agg(column_name, ', ' ORDER BY column_name)
--   FROM information_schema.column_privileges
--   WHERE table_schema = 'public' AND table_name = 'companies'
--     AND grantee IN ('anon', 'authenticated', 'service_role')
--     AND privilege_type = 'SELECT'
--   GROUP BY grantee, privilege_type;
--
-- Esperado:
--   anon           -> 16 colunas públicas (sem user_id, nif, documents_url, whatsapp)
--   authenticated  -> 18 colunas (as 16 públicas + created_at + user_id; sem nif, documents_url, whatsapp)
--   service_role   -> todas as colunas
-- ============================================================================


-- ============================================================================
-- ROLLBACK (comentado; só para referência, não executar sem decisão):
--
--   REVOKE SELECT (id, name, slug, sector, province, city, bairro, rua,
--     referencia_localizacao, description, email, phone, horario_atendimento,
--     estado_legalizacao, documento_legalizacao_url, is_approved, created_at, user_id)
--     ON TABLE public.companies FROM anon, authenticated;
--   GRANT SELECT ON TABLE public.companies TO anon, authenticated;
-- ============================================================================
