-- FASE 2 — endurecimento das cinco vistas públicas.
-- Estratégia: vistas públicas SECURITY INVOKER sobre vistas internas controladas.
-- As vistas internas pertencem a um papel NOLOGIN, sem BYPASSRLS, com SELECT
-- apenas nas colunas necessárias e políticas RLS próprias que exigem aprovação
-- e conta activa. Não se concede SELECT adicional nas tabelas aos papéis API.
-- Não altera dados, tabelas, colunas, políticas existentes ou funções existentes.

BEGIN;

-- 1. Papel técnico isolado. Não pode iniciar sessão, herdar privilégios nem
-- contornar RLS. Se já existir com configuração/membership inesperados, aborta.
DO $role$
DECLARE
  v_role_oid oid;
BEGIN
  SELECT oid INTO v_role_oid
  FROM pg_catalog.pg_roles
  WHERE rolname = 'negomapa_public_view_owner';

  IF v_role_oid IS NULL THEN
    EXECUTE 'CREATE ROLE negomapa_public_view_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS';
  ELSE
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.pg_auth_members
      WHERE member = v_role_oid
         OR (roleid = v_role_oid AND member <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres'))
    ) THEN
      RAISE EXCEPTION 'negomapa_public_view_owner tem memberships inesperadas; revisão manual necessária';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_catalog.pg_roles
      WHERE oid = v_role_oid
        AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolinherit
             OR rolcreatedb OR rolcreaterole OR rolreplication)
    ) THEN
      RAISE EXCEPTION 'negomapa_public_view_owner existe com atributos inseguros';
    END IF;
  END IF;
END
$role$;

ALTER ROLE negomapa_public_view_owner SET search_path = '';

-- 2. Acesso mínimo para o papel dono das vistas internas.
GRANT USAGE ON SCHEMA public TO negomapa_public_view_owner;
GRANT USAGE, CREATE ON SCHEMA negomapa_private
  TO negomapa_public_view_owner;

REVOKE ALL PRIVILEGES ON TABLE
  public.companies,
  public.profissionais,
  public.categorias,
  public.produtos,
  public.produto_imagens,
  public.vagas
FROM negomapa_public_view_owner;

GRANT SELECT (
  id, name, slug, sector, province, city, bairro, rua,
  referencia_localizacao, description, horario_atendimento,
  is_verified, is_approved, whatsapp, logo_url, portfolio, user_id
) ON TABLE public.companies TO negomapa_public_view_owner;

GRANT SELECT (
  id, nome, slug, categoria_id, provincia, municipio,
  anos_experiencia, bio, whatsapp, avatar_url, portfolio,
  disponibilidade_dias, disponibilidade_horarios, especialidades,
  experiencia_faixa, faixa_preco_desde, estado, user_id
) ON TABLE public.profissionais TO negomapa_public_view_owner;

GRANT SELECT (id, nome) ON TABLE public.categorias
  TO negomapa_public_view_owner;

GRANT SELECT (
  id, company_id, categoria_id, titulo, slug, descricao, preco,
  preco_tipo, estado_produto, entrega, provincia, municipio,
  criado_em, estado_aprovacao
) ON TABLE public.produtos TO negomapa_public_view_owner;

GRANT SELECT (id, produto_id, url, ordem)
  ON TABLE public.produto_imagens TO negomapa_public_view_owner;

GRANT SELECT (
  id, company_id, titulo, slug, descricao, requisitos, categoria,
  provincia, municipio, tipo_contrato, salario, estado, created_at
) ON TABLE public.vagas TO negomapa_public_view_owner;

-- A função auxiliar já existente foi auditada: SECURITY DEFINER, search_path
-- vazio e referências totalmente qualificadas. O EXECUTE é concedido apenas
-- ao papel interno adicional; não se alteram os grants usados pelas políticas
-- RLS actuais de anon/authenticated.
GRANT EXECUTE ON FUNCTION negomapa_private.is_account_active(uuid)
  TO negomapa_public_view_owner;

-- 3. Pré-condições: todas as tabelas devem continuar protegidas por RLS.
DO $rls_preconditions$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = ANY (ARRAY[
        'companies', 'profissionais', 'categorias',
        'produtos', 'produto_imagens', 'vagas'
      ])
      AND c.relrowsecurity IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'RLS não está activo em todas as tabelas necessárias às vistas públicas';
  END IF;

  IF to_regprocedure('negomapa_private.is_account_active(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Função negomapa_private.is_account_active(uuid) não encontrada';
  END IF;
END
$rls_preconditions$;

-- 4. Políticas RLS exclusivas do papel interno. Não substituem nem removem
-- políticas existentes; aplicam-se apenas ao papel NOLOGIN dono das vistas.
DO $policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'companies'
      AND policyname = 'negomapa_public_view_owner_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY negomapa_public_view_owner_select
      ON public.companies
      FOR SELECT TO negomapa_public_view_owner
      USING (
        is_approved IS TRUE
        AND negomapa_private.is_account_active(user_id)
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'profissionais'
      AND policyname = 'negomapa_public_view_owner_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY negomapa_public_view_owner_select
      ON public.profissionais
      FOR SELECT TO negomapa_public_view_owner
      USING (
        estado = 'aprovado'
        AND negomapa_private.is_account_active(user_id)
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'categorias'
      AND policyname = 'negomapa_public_view_owner_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY negomapa_public_view_owner_select
      ON public.categorias
      FOR SELECT TO negomapa_public_view_owner
      USING (true)
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'produtos'
      AND policyname = 'negomapa_public_view_owner_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY negomapa_public_view_owner_select
      ON public.produtos
      FOR SELECT TO negomapa_public_view_owner
      USING (
        estado_aprovacao = 'aprovado'
        AND EXISTS (
          SELECT 1
          FROM public.companies c
          WHERE c.id = produtos.company_id
            AND c.is_approved IS TRUE
            AND negomapa_private.is_account_active(c.user_id)
        )
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'produto_imagens'
      AND policyname = 'negomapa_public_view_owner_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY negomapa_public_view_owner_select
      ON public.produto_imagens
      FOR SELECT TO negomapa_public_view_owner
      USING (
        EXISTS (
          SELECT 1
          FROM public.produtos p
          JOIN public.companies c ON c.id = p.company_id
          WHERE p.id = produto_imagens.produto_id
            AND p.estado_aprovacao = 'aprovado'
            AND c.is_approved IS TRUE
            AND negomapa_private.is_account_active(c.user_id)
        )
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'vagas'
      AND policyname = 'negomapa_public_view_owner_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY negomapa_public_view_owner_select
      ON public.vagas
      FOR SELECT TO negomapa_public_view_owner
      USING (
        estado = 'aprovado'
        AND EXISTS (
          SELECT 1
          FROM public.companies c
          WHERE c.id = vagas.company_id
            AND c.is_approved IS TRUE
            AND negomapa_private.is_account_active(c.user_id)
        )
      )
    $sql$;
  END IF;
END
$policies$;

-- 5. Vistas internas. O papel proprietário não é dono das tabelas e não tem
-- BYPASSRLS: as políticas acima são aplicadas durante todas estas leituras.
-- A sessão de migração assume temporariamente o papel proprietário para criar
-- ou substituir as vistas internas. A membership temporária concedida
-- explicitamente ao executor é revogada depois da criação; qualquer membership
-- administrada pela plataforma fica fora do controlo desta migração.
GRANT negomapa_public_view_owner TO postgres;
SET LOCAL ROLE negomapa_public_view_owner;
-- O bloco cria as vistas na primeira execução e substitui as definições nas
-- execuções seguintes, mantendo o ficheiro idempotente.
DO $private_views$
DECLARE
  v_sql text;
BEGIN
  v_sql := $view$
    SELECT
      c.id, c.name, c.slug, c.sector, c.province, c.city, c.bairro, c.rua,
      c.referencia_localizacao, c.description, c.horario_atendimento,
      c.is_verified, c.is_approved, c.whatsapp, c.logo_url, c.portfolio
    FROM public.companies c
  $view$;
  IF to_regclass('negomapa_private.v_empresas_publicas') IS NULL THEN
    EXECUTE 'CREATE VIEW negomapa_private.v_empresas_publicas WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW negomapa_private.v_empresas_publicas WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  END IF;

  v_sql := $view$
    SELECT
      p.id, p.nome, p.slug, p.categoria_id, c.nome AS categoria,
      p.provincia, p.municipio, p.anos_experiencia, p.bio, p.whatsapp,
      p.avatar_url, p.portfolio, p.disponibilidade_dias,
      p.disponibilidade_horarios, p.especialidades, p.experiencia_faixa,
      p.faixa_preco_desde
    FROM public.profissionais p
    LEFT JOIN public.categorias c ON c.id = p.categoria_id
  $view$;
  IF to_regclass('negomapa_private.v_profissionais_publicos') IS NULL THEN
    EXECUTE 'CREATE VIEW negomapa_private.v_profissionais_publicos WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW negomapa_private.v_profissionais_publicos WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  END IF;

  v_sql := $view$
    SELECT
      p.id, p.categoria_id, p.titulo, p.slug, p.descricao, p.preco,
      p.preco_tipo, p.estado_produto, p.entrega, p.provincia, p.municipio,
      p.criado_em
    FROM public.produtos p
  $view$;
  IF to_regclass('negomapa_private.v_produtos_publicos') IS NULL THEN
    EXECUTE 'CREATE VIEW negomapa_private.v_produtos_publicos WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW negomapa_private.v_produtos_publicos WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  END IF;

  v_sql := $view$
    SELECT pi.id, pi.produto_id, pi.url, pi.ordem
    FROM public.produto_imagens pi
  $view$;
  IF to_regclass('negomapa_private.v_produto_imagens_publicas') IS NULL THEN
    EXECUTE 'CREATE VIEW negomapa_private.v_produto_imagens_publicas WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW negomapa_private.v_produto_imagens_publicas WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  END IF;

  v_sql := $view$
    SELECT
      v.id, v.company_id, v.titulo, v.slug, v.descricao, v.requisitos,
      v.categoria, v.provincia, v.municipio, v.tipo_contrato, v.salario,
      v.estado, v.created_at
    FROM public.vagas v
  $view$;
  IF to_regclass('negomapa_private.v_vagas_publicas') IS NULL THEN
    EXECUTE 'CREATE VIEW negomapa_private.v_vagas_publicas WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW negomapa_private.v_vagas_publicas WITH (security_barrier = true, security_invoker = false) AS ' || v_sql;
  END IF;
END
$private_views$;

-- As vistas internas devolvem exactamente a projecção pública aprovada.
-- Só leitura para os papéis API; a execução da consulta subjacente usa o
-- papel proprietário limitado e as suas políticas RLS.
REVOKE ALL PRIVILEGES ON TABLE
  negomapa_private.v_empresas_publicas,
  negomapa_private.v_profissionais_publicos,
  negomapa_private.v_produtos_publicos,
  negomapa_private.v_produto_imagens_publicas,
  negomapa_private.v_vagas_publicas
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE
  negomapa_private.v_empresas_publicas,
  negomapa_private.v_profissionais_publicos,
  negomapa_private.v_produtos_publicos,
  negomapa_private.v_produto_imagens_publicas,
  negomapa_private.v_vagas_publicas
TO anon, authenticated, service_role, postgres;

-- O papel é proprietário das vistas internas; retirar CREATE reduz privilégios.
RESET ROLE;
REVOKE CREATE ON SCHEMA negomapa_private FROM negomapa_public_view_owner;
REVOKE negomapa_public_view_owner FROM postgres;

-- 6. As cinco vistas públicas mantêm nomes, colunas, tipos e ordem actuais.
-- SECURITY INVOKER garante que o papel chamador não herda os privilégios do
-- proprietário da vista pública. A vista interna aplica RLS pelo owner restrito.
CREATE OR REPLACE VIEW public.empresas_publicas
WITH (security_invoker = true)
AS
SELECT
  id, name, slug, sector, province, city, bairro, rua,
  referencia_localizacao, description, horario_atendimento,
  is_verified, is_approved, whatsapp, logo_url, portfolio
FROM negomapa_private.v_empresas_publicas;

CREATE OR REPLACE VIEW public.profissionais_publicos
WITH (security_invoker = true)
AS
SELECT
  id, nome, slug, categoria_id, categoria, provincia, municipio,
  anos_experiencia, bio, whatsapp, avatar_url, portfolio,
  disponibilidade_dias, disponibilidade_horarios, especialidades,
  experiencia_faixa, faixa_preco_desde
FROM negomapa_private.v_profissionais_publicos;

CREATE OR REPLACE VIEW public.produtos_publicos
WITH (security_invoker = true)
AS
SELECT
  id, categoria_id, titulo, slug, descricao, preco, preco_tipo,
  estado_produto, entrega, provincia, municipio, criado_em
FROM negomapa_private.v_produtos_publicos;

CREATE OR REPLACE VIEW public.produto_imagens_publicas
WITH (security_invoker = true)
AS
SELECT id, produto_id, url, ordem
FROM negomapa_private.v_produto_imagens_publicas;

CREATE OR REPLACE VIEW public.vagas_publicas
WITH (security_invoker = true)
AS
SELECT
  id, company_id, titulo, slug, descricao, requisitos, categoria,
  provincia, municipio, tipo_contrato, salario, estado, created_at
FROM negomapa_private.v_vagas_publicas;

-- Retira privilégios de escrita nas vistas públicas (incluindo service_role).
-- As permissões nas tabelas base e as operações administrativas não são alteradas.
REVOKE ALL PRIVILEGES ON TABLE
  public.empresas_publicas,
  public.profissionais_publicos,
  public.produtos_publicos,
  public.produto_imagens_publicas,
  public.vagas_publicas
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE
  public.empresas_publicas,
  public.profissionais_publicos,
  public.produtos_publicos,
  public.produto_imagens_publicas,
  public.vagas_publicas
TO anon, authenticated, service_role;

-- O executor postgres conserva SELECT nas vistas internas para poder
-- definir/substituir as vistas públicas SECURITY INVOKER em futuras migrações.
-- O schema privado não é exposto pela API; os papéis de runtime recebem apenas
-- SELECT e não são membros do papel proprietário.

-- 7. Verificações estruturais fail-closed. Se qualquer condição falhar,
-- a migração inteira é revertida pela transacção.
DO $validation$
DECLARE
  v_count integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE rolname = 'negomapa_public_view_owner'
      AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolinherit
           OR rolcreatedb OR rolcreaterole OR rolreplication)
  ) THEN
    RAISE EXCEPTION 'O papel proprietário não cumpre o perfil NOLOGIN/NOBYPASSRLS';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'negomapa_private'
    AND c.relname = ANY (ARRAY[
      'v_empresas_publicas', 'v_profissionais_publicos',
      'v_produtos_publicos', 'v_produto_imagens_publicas', 'v_vagas_publicas'
    ])
    AND pg_catalog.pg_get_userbyid(c.relowner) = 'negomapa_public_view_owner';
  IF v_count <> 5 THEN
    RAISE EXCEPTION 'Nem todas as vistas internas pertencem ao papel restrito';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY (ARRAY[
      'empresas_publicas', 'profissionais_publicos', 'produtos_publicos',
      'produto_imagens_publicas', 'vagas_publicas'
    ])
    AND c.reloptions @> ARRAY['security_invoker=true'];
  IF v_count <> 5 THEN
    RAISE EXCEPTION 'Nem todas as vistas públicas estão em SECURITY INVOKER';
  END IF;

  IF NOT has_function_privilege(
    'negomapa_public_view_owner',
    'negomapa_private.is_account_active(uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'O papel interno não pode executar a função de conta activa';
  END IF;

  IF has_table_privilege('anon', 'public.empresas_publicas', 'INSERT')
     OR has_table_privilege('authenticated', 'public.empresas_publicas', 'UPDATE')
     OR has_table_privilege('service_role', 'public.profissionais_publicos', 'DELETE') THEN
    RAISE EXCEPTION 'Foi detectado privilégio de escrita numa vista pública';
  END IF;

  IF NOT has_table_privilege('anon', 'public.empresas_publicas', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.profissionais_publicos', 'SELECT')
     OR NOT has_table_privilege('anon', 'public.produtos_publicos', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.produto_imagens_publicas', 'SELECT')
     OR NOT has_table_privilege('anon', 'public.vagas_publicas', 'SELECT') THEN
    RAISE EXCEPTION 'Falta SELECT público numa das vistas compatíveis';
  END IF;
END
$validation$;

COMMIT;

-- Testes pós-migração (executar em sessão de teste, sem dados de produção):
-- 1) SET LOCAL ROLE anon; SELECT count(*) FROM cada vista pública; RESET ROLE.
-- 2) SET LOCAL ROLE authenticated; SELECT count(*) FROM cada vista pública; RESET ROLE.
-- 3) Repetir com JWT de administrador: as vistas continuam a devolver apenas
--    conteúdo aprovado de contas activas; o acesso administrativo às tabelas/RPC
--    não é alterado por esta migração.
-- 4) Comparar cada vista com os seus predicados de aprovação + conta activa.
-- 5) EXPLAIN (ANALYZE, BUFFERS) nas consultas de listagem/filtros em ambiente
--    de staging com dados representativos; security_barrier pode reduzir
--    predicate pushdown, pelo que o desempenho em escala ainda deve ser medido.
