-- =====================================================================
-- TESTES SQL B.6.24 — permissões e estrutura (NÃO EXECUTADOS)
-- Correr só em branch de teste, ou no projeto depois de aprovação.
--
-- Cada bloco está em BEGIN ... ROLLBACK. Nenhum teste insere dados.
-- Não usa o perfil real "Fred Tomás". Não fabrica claims
-- (request.jwt.claims): os testes sem sessão só usam o role anon
-- ou authenticated sem utilizador (auth.uid() = NULL).
--
-- O que este ficheiro NÃO cobre (exige sessões reais de utilizadores de
-- teste, porque auth.uid() depende do JWT): dono lê o próprio
-- motivo_rejeicao, outro utilizador não vê o perfil, admin vê a lista.
-- Esses casos estão em supabase/pendentes/testes-b6-24-sessoes.mjs.
-- =====================================================================

-- 1. ESTRUTURA E PERMISSÕES (catálogo)
BEGIN;
DO $t$
DECLARE
  v_ret text;
  v_secdef boolean;
  v_vol "char";
  v_cfg text[];
  v_owner text;
  v_acl aclitem[];
  v_public_exec boolean;
BEGIN
  SELECT pg_get_function_result(p.oid), p.prosecdef, p.provolatile, p.proconfig, pg_get_userbyid(p.proowner), p.proacl
    INTO v_ret, v_secdef, v_vol, v_cfg, v_owner, v_acl
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'get_my_profissional_profile';

  ASSERT v_ret = 'TABLE(id uuid, nome text, telefone text, whatsapp text, bio text, provincia text, municipio text, estado text, motivo_rejeicao text, slug text, avatar_url text, anos_experiencia smallint, disponibilidade_dias text[], disponibilidade_horarios jsonb, portfolio jsonb)',
    'get_my_profissional_profile: colunas/tipos/ordem inesperados: ' || v_ret;
  ASSERT v_ret NOT LIKE '%avaliado_por%' AND v_ret NOT LIKE '%avaliado_em%',
    'get_my_profissional_profile não pode expor avaliado_por nem avaliado_em';
  ASSERT v_secdef, 'get_my_profissional_profile deve ser SECURITY DEFINER';
  ASSERT v_vol = 's', 'get_my_profissional_profile deve ser STABLE';
  ASSERT v_cfg @> ARRAY['search_path=""'], 'get_my_profissional_profile deve ter search_path vazio';
  ASSERT v_owner = 'postgres', 'get_my_profissional_profile deve pertencer a postgres';
  ASSERT NOT has_function_privilege('anon', 'public.get_my_profissional_profile()', 'EXECUTE'),
    'anon NÃO pode executar get_my_profissional_profile';
  ASSERT has_function_privilege('authenticated', 'public.get_my_profissional_profile()', 'EXECUTE'),
    'authenticated deve executar get_my_profissional_profile';
  SELECT EXISTS (SELECT 1 FROM aclexplode(v_acl) a WHERE a.grantee = 0) INTO v_public_exec;
  ASSERT NOT v_public_exec, 'PUBLIC não pode executar get_my_profissional_profile';

  SELECT pg_get_function_result(p.oid), p.prosecdef, p.provolatile, p.proconfig, pg_get_userbyid(p.proowner), p.proacl
    INTO v_ret, v_secdef, v_vol, v_cfg, v_owner, v_acl
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'admin_listar_profissionais';

  ASSERT v_ret = 'TABLE(id uuid, nome text, estado text, provincia text, municipio text, whatsapp text, slug text, created_at timestamp with time zone, motivo_rejeicao text, avaliado_em timestamp with time zone)',
    'admin_listar_profissionais: colunas inesperadas: ' || v_ret;
  ASSERT v_ret NOT LIKE '%avaliado_por%', 'admin_listar_profissionais não deve expor avaliado_por';
  ASSERT v_secdef, 'admin_listar_profissionais deve ser SECURITY DEFINER';
  ASSERT v_cfg @> ARRAY['search_path=""'], 'admin_listar_profissionais deve ter search_path vazio';
  ASSERT NOT has_function_privilege('anon', 'public.admin_listar_profissionais()', 'EXECUTE'),
    'anon NÃO pode executar admin_listar_profissionais';
  ASSERT has_function_privilege('authenticated', 'public.admin_listar_profissionais()', 'EXECUTE'),
    'authenticated deve poder chamar admin_listar_profissionais (a função valida is_admin)';
  SELECT EXISTS (SELECT 1 FROM aclexplode(v_acl) a WHERE a.grantee = 0) INTO v_public_exec;
  ASSERT NOT v_public_exec, 'PUBLIC não pode executar admin_listar_profissionais';

  -- motivo_rejeicao não é legível diretamente
  ASSERT NOT has_column_privilege('authenticated', 'public.profissionais', 'motivo_rejeicao', 'SELECT'),
    'authenticated não deve ter SELECT direto em motivo_rejeicao';
  ASSERT NOT has_column_privilege('anon', 'public.profissionais', 'motivo_rejeicao', 'SELECT'),
    'anon não deve ter SELECT em motivo_rejeicao';
  ASSERT NOT has_column_privilege('authenticated', 'public.profissionais', 'avaliado_em', 'SELECT'),
    'authenticated não deve ter SELECT direto em avaliado_em';

  RAISE NOTICE 'OK: estrutura e permissões de catálogo';
END
$t$;
ROLLBACK;

-- 2. ANON: bloqueado nas duas RPCs (42501)
BEGIN;
SET LOCAL ROLE anon;
DO $t$
BEGIN
  BEGIN
    PERFORM 1 FROM public.get_my_profissional_profile();
    RAISE EXCEPTION 'FALHA: anon chamou get_my_profissional_profile';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM 1 FROM public.admin_listar_profissionais();
    RAISE EXCEPTION 'FALHA: anon chamou admin_listar_profissionais';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM motivo_rejeicao FROM public.profissionais LIMIT 1;
    RAISE EXCEPTION 'FALHA: anon leu motivo_rejeicao';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'OK: anon bloqueado';
END
$t$;
RESET ROLE;
ROLLBACK;

-- 3. AUTHENTICATED SEM UTILIZADOR (auth.uid() = NULL)
BEGIN;
SET LOCAL ROLE authenticated;
DO $t$
DECLARE
  v_n integer;
BEGIN
  -- Sem auth.uid() o filtro não devolve nada.
  SELECT count(*) INTO v_n FROM public.get_my_profissional_profile();
  ASSERT v_n = 0, 'Sem auth.uid(), get_my_profissional_profile deve devolver 0 linhas';

  -- Sem SELECT direto em motivo_rejeicao.
  BEGIN
    PERFORM motivo_rejeicao FROM public.profissionais LIMIT 1;
    RAISE EXCEPTION 'FALHA: authenticated leu motivo_rejeicao diretamente';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- Não-admin (sem utilizador) não lista.
  BEGIN
    PERFORM 1 FROM public.admin_listar_profissionais();
    RAISE EXCEPTION 'FALHA: não-admin listou profissionais';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'Apenas administradores%' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'OK: authenticated sem sessão';
END
$t$;
RESET ROLE;
ROLLBACK;
