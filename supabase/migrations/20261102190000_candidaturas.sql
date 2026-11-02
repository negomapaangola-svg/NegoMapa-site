-- =====================================================================
-- Candidaturas a vagas — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102190000_candidaturas_reversao.sql
--
-- Conteúdo:
--   1. Tabela public.candidaturas (nova): id, vaga_id, user_id, nome_candidato (obrigatório, 3 a 120
--      caracteres; Tarefa 23), mensagem, cv_url (opcional), estado, criada_em.
--      Não guarda telefone nem e-mail do candidato.
--   2. Estados: enviada, em_analise, aceite, rejeitada.
--   3. Uma candidatura por utilizador e vaga (UNIQUE (vaga_id, user_id)).
--   4. RLS:
--        - Candidato: lê e cria as próprias candidaturas, só em vagas aprovadas e com empresa aprovada;
--          na criação o estado é 'enviada'.
--        - Empresa: lê as candidaturas das vagas da sua empresa (companies.user_id = auth.uid()).
--        - Administrador (is_admin()): lê tudo.
--   5. Alteração de estado (Tarefa 16B): empresa dona da vaga e administrador podem definir
--      em_analise, aceite ou rejeitada. O candidato não altera nem elimina a candidatura.
--      Ninguém tem DELETE, exceto service_role.
--
-- Fora do âmbito: páginas, componentes, e-mails, notificações, upload de CV (apenas o URL é guardado).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1 e 2. Tabela
-- ---------------------------------------------------------------------
CREATE TABLE public.candidaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_candidato text NOT NULL CHECK (length(btrim(nome_candidato)) BETWEEN 3 AND 120),
  mensagem text NOT NULL CHECK (length(btrim(mensagem)) BETWEEN 10 AND 2000),
  cv_url text NULL CHECK (cv_url IS NULL OR (length(cv_url) <= 500 AND cv_url ~ '^https://')),
  estado text NOT NULL DEFAULT 'enviada' CHECK (estado IN ('enviada', 'em_analise', 'aceite', 'rejeitada')),
  criada_em timestamptz NOT NULL DEFAULT now(),
  -- 3. Uma candidatura por utilizador e vaga
  CONSTRAINT candidaturas_vaga_user_unica UNIQUE (vaga_id, user_id)
);

COMMENT ON TABLE public.candidaturas IS
  'Candidaturas de utilizadores a vagas aprovadas. Uma por utilizador e vaga.';

CREATE INDEX candidaturas_user_id_idx ON public.candidaturas (user_id);

-- ---------------------------------------------------------------------
-- Funções auxiliares (SECURITY DEFINER evita recursão com RLS de vagas e companies)
-- ---------------------------------------------------------------------
CREATE FUNCTION public.vaga_disponivel_para_candidatura(p_vaga_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT EXISTS (
    SELECT 1
      FROM public.vagas v
      JOIN public.companies c ON c.id = v.company_id
     WHERE v.id = p_vaga_id
       AND v.estado = 'aprovado'
       AND c.is_approved = true
  )
$f$;

CREATE FUNCTION public.empresa_dona_da_vaga(p_vaga_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT EXISTS (
    SELECT 1
      FROM public.vagas v
      JOIN public.companies c ON c.id = v.company_id
     WHERE v.id = p_vaga_id
       AND c.user_id = auth.uid()
  )
$f$;

REVOKE ALL ON FUNCTION public.vaga_disponivel_para_candidatura(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vaga_disponivel_para_candidatura(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.empresa_dona_da_vaga(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_dona_da_vaga(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------
REVOKE ALL ON public.candidaturas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.candidaturas TO authenticated;
GRANT UPDATE (estado) ON public.candidaturas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidaturas TO service_role;

-- ---------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.candidaturas ENABLE ROW LEVEL SECURITY;

-- Candidato: vê as próprias candidaturas
CREATE POLICY candidaturas_select_candidato ON public.candidaturas
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Candidato: cria candidatura própria, em estado 'enviada', numa vaga disponível.
-- Tarefa 35: o dono da empresa da vaga não se pode candidatar à própria vaga (também por API direta).
CREATE POLICY candidaturas_insert_candidato ON public.candidaturas
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND estado = 'enviada'
    AND public.vaga_disponivel_para_candidatura(vaga_id)
    AND NOT public.empresa_dona_da_vaga(vaga_id)
  );

-- Empresa: vê as candidaturas das vagas da sua empresa
CREATE POLICY candidaturas_select_empresa ON public.candidaturas
  FOR SELECT TO authenticated
  USING (public.empresa_dona_da_vaga(vaga_id));

-- Administrador: vê tudo
CREATE POLICY candidaturas_select_admin ON public.candidaturas
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- Empresa dona da vaga: altera o estado para em_analise, aceite ou rejeitada.
-- USING limita às candidaturas das suas vagas; WITH CHECK limita os estados de destino.
-- O candidato não tem policy de UPDATE: não consegue alterar nem o estado.
CREATE POLICY candidaturas_update_empresa ON public.candidaturas
  FOR UPDATE TO authenticated
  USING (public.empresa_dona_da_vaga(vaga_id))
  WITH CHECK (
    public.empresa_dona_da_vaga(vaga_id)
    AND estado IN ('em_analise', 'aceite', 'rejeitada')
  );

-- Administrador: altera o estado nas mesmas condições.
CREATE POLICY candidaturas_update_admin ON public.candidaturas
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK (
    (SELECT public.is_admin())
    AND estado IN ('em_analise', 'aceite', 'rejeitada')
  );

-- Sem policy de DELETE para authenticated: ninguém elimina candidaturas.

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) has_table_privilege('anon','public.candidaturas','SELECT') -> false
--   b) Segunda candidatura do mesmo utilizador à mesma vaga -> erro de UNIQUE (23505)
--   c) Candidato insere com estado 'aceite' -> recusado pela RLS
--   d) Candidato insere em vaga pendente ou de empresa não aprovada -> recusado pela RLS
--   e) Empresa A não vê candidaturas de vagas da empresa B
--   f) Administrador vê todas
--   g) Candidato tenta UPDATE de estado na própria candidatura -> 0 linhas (sem policy)
--   h) Empresa tenta definir estado 'enviada' -> recusado pela RLS
--   i) Empresa A altera candidatura de vaga da empresa B -> 0 linhas
--   j) Candidato tenta DELETE -> 0 linhas (sem policy)
--   k) Candidatura com nome_candidato vazio ou com menos de 3 caracteres -> recusada pelo CHECK (23514)
--   l) Dono da empresa insere candidatura na própria vaga (formulário ou API direta) -> recusada pela RLS (42501)
-- ---------------------------------------------------------------------
