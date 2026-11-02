-- =============================================================================
-- TESTES T1 a T10 — FASE A
--
-- ESTADO: NÃO EXECUTADOS. Escritos e revistos estaticamente (Tarefa 5).
-- Executar só num branch Supabase de ensaio, nunca em produção.
-- Tudo corre numa transação que termina em ROLLBACK.
--
-- Estado esperado de cada teste ao executar:
--   T1 e T2: PENDENTES DA FASE C. Antes da Fase C, anon ainda lê as colunas;
--            o script só regista "PENDENTE (Fase C)" e não interrompe.
--   T3 a T10: esperados para a Fase A. Não estão aprovados até serem executados
--            e os resultados registados.
--
-- Fora do âmbito desta fase: testes de is_admin() e de REVOKE em objetos
-- existentes. Ficam para a fase separada de revogação de EXECUTE.
--
-- Pré-condições de ensaio (verificar no branch antes de correr):
--   - Colunas NOT NULL adicionais em companies, vagas e profissionais: ajustar fixtures.
--   - profiles.id pode ter FK para auth.users: o T8 pode precisar de um utilizador real.
--   - Executar como postgres (ou role com BYPASSRLS) para os fixtures.
--   - PostgreSQL 15 ou superior (security_invoker).
-- =============================================================================

BEGIN;

-- ---------- Fixtures (como postgres, ignora RLS) -----------------------------
-- 22222222-... : dono de empresa aprovada (empresa 11111111-...)
-- 44444444-... : dono de empresa pendente (empresa 33333333-...)
-- 99999999-... : profissional aprovado
-- bbbbbbbb-... : profissional pendente
-- dddddddd-... : autenticado sem perfil profissional
-- cccccccc-... : administrador (admin_users + profiles.is_admin = true, no T8)

INSERT INTO public.companies (id, name, slug, is_approved, user_id, nif, documento_legalizacao_url, phone, email)
VALUES ('11111111-1111-1111-1111-111111111111', 'Empresa Teste', 'empresa-teste', true,
        '22222222-2222-2222-2222-222222222222', '500000000', 'https://exemplo.invalid/doc.pdf',
        '+244900000000', 'teste@exemplo.invalid');

INSERT INTO public.companies (id, name, slug, is_approved, user_id, nif)
VALUES ('33333333-3333-3333-3333-333333333333', 'Empresa Pendente', 'empresa-pendente', false,
        '44444444-4444-4444-4444-444444444444', '600000000');

INSERT INTO public.vagas (id, company_id, titulo, slug, estado, whatsapp, motivo_rejeicao, avaliado_por)
VALUES ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
        'Vaga aprovada', 'vaga-aprovada', 'aprovado', '+244911111111', NULL, NULL),
       ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
        'Vaga pendente', 'vaga-pendente', 'pendente', '+244922222222', NULL, NULL),
       ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333',
        'Vaga de empresa pendente', 'vaga-empresa-pendente', 'aprovado', '+244933333333', NULL, NULL);

INSERT INTO public.profissionais (id, user_id, nome, telefone, whatsapp, provincia, municipio, slug, estado)
VALUES ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999',
        'Profissional Aprovado', '+244944444444', '+244944444444', 'Luanda', 'Belas', 'prof-aprovado', 'aprovado'),
       ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Profissional Pendente', '+244955555555', '+244955555555', 'Luanda', 'Belas', 'prof-pendente', 'pendente');

INSERT INTO public.admin_users (user_id)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc')
ON CONFLICT DO NOTHING;

-- Função auxiliar: define o utilizador (JWT) que auth.uid() vai ler
CREATE OR REPLACE FUNCTION pg_temp.fingir_utilizador(p_uid uuid)
RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$$;

-- Função auxiliar: afirmação. Falha interrompe a transação.
CREATE OR REPLACE FUNCTION pg_temp.afirmar(p_id text, p_ok boolean, p_detalhe text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_ok THEN
    RAISE NOTICE 'PASSOU %: %', p_id, p_detalhe;
  ELSE
    RAISE EXCEPTION 'FALHOU %: %', p_id, p_detalhe;
  END IF;
END;
$$;

-- ---------- T1 (PENDENTE DA FASE C): anon não lê vagas.whatsapp -------------
-- Antes da Fase C: deve registar PENDENTE. Depois da Fase C: deve registar PASSOU.
DO $$
DECLARE
  v_ok boolean := false;
BEGIN
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM whatsapp FROM public.vagas LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN
    v_ok := true;
  END;
  RESET ROLE;
  IF v_ok THEN
    RAISE NOTICE 'PASSOU T1: anon sem SELECT em vagas.whatsapp';
  ELSE
    RAISE NOTICE 'PENDENTE (Fase C) T1: anon ainda lê vagas.whatsapp';
  END IF;
END
$$;

-- ---------- T2 (PENDENTE DA FASE C): anon não lê companies.documento_legalizacao_url
DO $$
DECLARE
  v_ok boolean := false;
BEGIN
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM documento_legalizacao_url FROM public.companies LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN
    v_ok := true;
  END;
  RESET ROLE;
  IF v_ok THEN
    RAISE NOTICE 'PASSOU T2: anon sem SELECT em companies.documento_legalizacao_url';
  ELSE
    RAISE NOTICE 'PENDENTE (Fase C) T2: anon ainda lê companies.documento_legalizacao_url';
  END IF;
END
$$;

-- ---------- T3: vista pública de vagas não expõe whatsapp nem moderação -------
DO $$
DECLARE
  v_tem_whatsapp boolean;
  v_tem_motivo boolean;
  v_linhas integer;
BEGIN
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_linhas FROM public.vagas_publicas;
  RESET ROLE;

  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'vagas_publicas' AND column_name = 'whatsapp')
    INTO v_tem_whatsapp;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'vagas_publicas' AND column_name = 'motivo_rejeicao')
    INTO v_tem_motivo;

  PERFORM pg_temp.afirmar('T3',
    NOT v_tem_whatsapp AND NOT v_tem_motivo AND v_linhas >= 1,
    format('vista sem whatsapp/motivo; linhas visíveis a anon = %s', v_linhas));
END
$$;

-- ---------- T4: autenticado sem perfil profissional recebe NULL --------------
DO $$
DECLARE
  v_contacto text;
BEGIN
  PERFORM pg_temp.fingir_utilizador('dddddddd-dddd-dddd-dddd-dddddddddddd');
  SET LOCAL ROLE authenticated;
  SELECT public.obter_contacto_candidatura('55555555-5555-5555-5555-555555555555') INTO v_contacto;
  RESET ROLE;
  PERFORM pg_temp.afirmar('T4', v_contacto IS NULL, format('contacto = %s (esperado NULL)', coalesce(v_contacto, 'NULL')));
END
$$;

-- ---------- T5: profissional aprovado recebe o WhatsApp da vaga aprovada -----
DO $$
DECLARE
  v_contacto text;
BEGIN
  PERFORM pg_temp.fingir_utilizador('99999999-9999-9999-9999-999999999999');
  SET LOCAL ROLE authenticated;
  SELECT public.obter_contacto_candidatura('55555555-5555-5555-5555-555555555555') INTO v_contacto;
  RESET ROLE;
  PERFORM pg_temp.afirmar('T5', v_contacto = '+244911111111', format('contacto = %s', coalesce(v_contacto, 'NULL')));
END
$$;

-- ---------- T5b: profissional aprovado não recebe contacto de vaga pendente ---
DO $$
DECLARE
  v_contacto text;
BEGIN
  PERFORM pg_temp.fingir_utilizador('99999999-9999-9999-9999-999999999999');
  SET LOCAL ROLE authenticated;
  SELECT public.obter_contacto_candidatura('66666666-6666-6666-6666-666666666666') INTO v_contacto;
  RESET ROLE;
  PERFORM pg_temp.afirmar('T5b', v_contacto IS NULL, 'vaga pendente não devolve contacto');
END
$$;

-- ---------- T5c: profissional pendente não recebe contacto --------------------
DO $$
DECLARE
  v_contacto text;
BEGIN
  PERFORM pg_temp.fingir_utilizador('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  SET LOCAL ROLE authenticated;
  SELECT public.obter_contacto_candidatura('55555555-5555-5555-5555-555555555555') INTO v_contacto;
  RESET ROLE;
  PERFORM pg_temp.afirmar('T5c', v_contacto IS NULL, 'profissional pendente não recebe contacto');
END
$$;

-- ---------- T5d: vaga de empresa não aprovada não devolve contacto -----------
DO $$
DECLARE
  v_contacto text;
BEGIN
  PERFORM pg_temp.fingir_utilizador('99999999-9999-9999-9999-999999999999');
  SET LOCAL ROLE authenticated;
  SELECT public.obter_contacto_candidatura('77777777-7777-7777-7777-777777777777') INTO v_contacto;
  RESET ROLE;
  PERFORM pg_temp.afirmar('T5d', v_contacto IS NULL, 'vaga de empresa não aprovada não devolve contacto');
END
$$;

-- ---------- T6: dono recebe a própria empresa, com NIF -----------------------
DO $$
DECLARE
  v_nif text;
  v_linhas integer;
BEGIN
  PERFORM pg_temp.fingir_utilizador('22222222-2222-2222-2222-222222222222');
  SET LOCAL ROLE authenticated;
  SELECT count(*), max(nif) INTO v_linhas, v_nif FROM public.obter_minha_empresa();
  RESET ROLE;
  PERFORM pg_temp.afirmar('T6', v_linhas = 1 AND v_nif = '500000000',
    format('linhas = %s, nif visível ao dono = %s', v_linhas, coalesce(v_nif, 'NULL')));
END
$$;

-- ---------- T7: utilizador que não é dono não recebe a empresa ---------------
DO $$
DECLARE
  v_linhas integer;
BEGIN
  PERFORM pg_temp.fingir_utilizador('99999999-9999-9999-9999-999999999999');
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_linhas FROM public.obter_minha_empresa();
  RESET ROLE;
  PERFORM pg_temp.afirmar('T7', v_linhas = 0, format('linhas devolvidas a não dono = %s', v_linhas));
END
$$;

-- ---------- T8: administrador lê o detalhe via RPC existente -----------------
-- Pré-condição: admin_obter_empresa exige profiles.is_admin = true.
-- Se profiles.id tiver FK para auth.users, criar primeiro o utilizador de teste.
DO $$
DECLARE
  v_linhas integer;
BEGIN
  INSERT INTO public.profiles (id, is_admin)
  VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;

  PERFORM pg_temp.fingir_utilizador('cccccccc-cccc-cccc-cccc-cccccccccccc');
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_linhas FROM public.admin_obter_empresa('11111111-1111-1111-1111-111111111111');
  RESET ROLE;
  PERFORM pg_temp.afirmar('T8', v_linhas = 1, format('admin lê empresa via RPC: linhas = %s', v_linhas));
END
$$;

-- ---------- T9: não admin é recusado pela RPC de admin -----------------------
DO $$
DECLARE
  v_ok boolean := false;
BEGIN
  PERFORM pg_temp.fingir_utilizador('99999999-9999-9999-9999-999999999999');
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM 1 FROM public.admin_obter_empresa('11111111-1111-1111-1111-111111111111');
  EXCEPTION WHEN insufficient_privilege THEN
    v_ok := true;
  END;
  RESET ROLE;
  PERFORM pg_temp.afirmar('T9', v_ok, 'não admin recebe 42501 de admin_obter_empresa');
END
$$;

-- ---------- T10: EXECUTE das funções novas da Fase A -------------------------
-- Não testa is_admin(): essa permissão não é alterada nesta fase.
DO $$
BEGIN
  PERFORM pg_temp.afirmar('T10a',
    NOT has_function_privilege('anon', 'public.obter_contacto_candidatura(uuid)', 'EXECUTE'),
    'anon sem EXECUTE em obter_contacto_candidatura()');
  PERFORM pg_temp.afirmar('T10b',
    NOT has_function_privilege('anon', 'public.obter_minha_empresa()', 'EXECUTE'),
    'anon sem EXECUTE em obter_minha_empresa()');
  PERFORM pg_temp.afirmar('T10c',
    NOT EXISTS (
      SELECT 1
        FROM pg_proc p, aclexplode(p.proacl) a
       WHERE p.oid = 'public.obter_contacto_candidatura(uuid)'::regprocedure
         AND a.grantee = 0                -- 0 = PUBLIC
         AND a.privilege_type = 'EXECUTE'),
    'PUBLIC sem EXECUTE em obter_contacto_candidatura()');
  PERFORM pg_temp.afirmar('T10d',
    NOT EXISTS (
      SELECT 1
        FROM pg_proc p, aclexplode(p.proacl) a
       WHERE p.oid = 'public.obter_minha_empresa()'::regprocedure
         AND a.grantee = 0
         AND a.privilege_type = 'EXECUTE'),
    'PUBLIC sem EXECUTE em obter_minha_empresa()');
  PERFORM pg_temp.afirmar('T10e',
    has_function_privilege('authenticated', 'public.obter_contacto_candidatura(uuid)', 'EXECUTE')
    AND has_function_privilege('authenticated', 'public.obter_minha_empresa()', 'EXECUTE'),
    'authenticated com EXECUTE nas duas funções novas');
END
$$;

-- Fim: reverter todos os fixtures e testes (nada fica gravado)
ROLLBACK;
