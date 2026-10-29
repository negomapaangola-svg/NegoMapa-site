-- Testes para get_my_profissional_profile() e para getUserProfile().
-- Só SELECT, dentro de transações com ROLLBACK. Não grava dados.
-- Substituir <UUID_DONO> por user_id de um profissional e <UUID_OUTRO> por user_id de outro utilizador.

-- A) A função existe, é SECURITY DEFINER e só tem EXECUTE para authenticated
SELECT p.proname,
       p.prosecdef AS security_definer,
       has_function_privilege('anon',          'public.get_my_profissional_profile()', 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', 'public.get_my_profissional_profile()', 'EXECUTE') AS auth_execute
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'get_my_profissional_profile';
-- Esperado: security_definer=true, anon_execute=false, auth_execute=true

-- B) Dono recebe o próprio perfil, com telefone e sem bi_numero
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"<UUID_DONO>","role":"authenticated"}', true);
SELECT * FROM public.get_my_profissional_profile();
ROLLBACK;
-- Esperado: 1 linha; colunas da assinatura; sem bi_numero, user_id nem updated_at.

-- C) Outro utilizador autenticado não recebe o perfil do dono
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"<UUID_OUTRO>","role":"authenticated"}', true);
SELECT id, telefone FROM public.get_my_profissional_profile();
ROLLBACK;
-- Esperado: 0 linhas se <UUID_OUTRO> não tiver perfil, ou só o próprio perfil de <UUID_OUTRO>. Nunca o de <UUID_DONO>.

-- D) anon não consegue executar a função
BEGIN;
SET LOCAL ROLE anon;
SELECT * FROM public.get_my_profissional_profile();
ROLLBACK;
-- Esperado: erro 42501 (permission denied for function get_my_profissional_profile).

-- E) anon não consegue ler telefone diretamente (depois de aplicar 20261029_restringir_colunas_publicas_profissionais)
BEGIN;
SET LOCAL ROLE anon;
SELECT telefone FROM public.profissionais LIMIT 1;
ROLLBACK;
-- Esperado: erro 42501 (permission denied for column telefone).

-- F) authenticated não consegue ler telefone diretamente de outra pessoa (depois da migração)
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"<UUID_OUTRO>","role":"authenticated"}', true);
SELECT telefone FROM public.profissionais WHERE user_id = '<UUID_DONO>';
ROLLBACK;
-- Esperado: erro 42501 (permission denied for column telefone).

-- G) Regressão de getUserProfile: a leitura via RPC devolve os mesmos campos que antes
--    (exceto bi_numero, que continua a vir de obter_bi_proprio)
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"<UUID_DONO>","role":"authenticated"}', true);
SELECT id, nome, telefone, whatsapp, bio, provincia, municipio, estado, slug, avatar_url,
       anos_experiencia, disponibilidade_dias, disponibilidade_horarios, portfolio
FROM public.get_my_profissional_profile();
SELECT public.obter_bi_proprio();
ROLLBACK;

-- H) Testes de UI (manual, com conta de teste aprovada pelo utilizador; não feitos nesta preparação)
--    1. Dono abre /editar-perfil: carrega nome, telefone, whatsapp, bio, província, município e portfólio.
--    2. Dono abre /cadastrar-servico: carrega o perfil e o formulário funciona.
--    3. Outro utilizador não vê o telefone de um profissional que não é o seu.
--    4. Sessão anónima: /editar-perfil e /cadastrar-servico redirecionam para login.
