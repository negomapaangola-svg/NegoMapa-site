-- =====================================================================
-- Tabela de notificações — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102170000_notificacoes_reversao.sql
--
-- Conteúdo:
--   1. Tabela public.notificacoes (nova; não existe em produção).
--   2. Canal aceita apenas 'email', 'plataforma' e 'whatsapp'.
--   3. Índices em (user_id) e (user_id, lida).
--   4. RLS ativa:
--        - SELECT: o utilizador lê apenas as próprias notificações.
--        - UPDATE: o utilizador altera apenas as próprias notificações, e só a coluna lida (GRANT por coluna).
--        - INSERT, DELETE: sem policy para utilizadores; sem GRANT para anon nem authenticated.
--   5. Criação só pela função public.criar_notificacao(), SECURITY DEFINER,
--      com EXECUTE apenas para service_role (chamada pelo servidor).
--
-- Fora do âmbito: páginas, componentes, e-mails, integração com WhatsApp, envio real de notificações.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1 e 2. Tabela
-- ---------------------------------------------------------------------
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (length(btrim(tipo)) BETWEEN 1 AND 60),
  titulo text NOT NULL CHECK (length(btrim(titulo)) BETWEEN 1 AND 200),
  corpo text NOT NULL CHECK (length(corpo) <= 2000),
  canal text NOT NULL CHECK (canal IN ('email', 'plataforma', 'whatsapp')),
  referencia_id uuid NULL,
  lida boolean NOT NULL DEFAULT false,
  criada_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notificacoes IS
  'Notificações por utilizador. Criadas apenas por criar_notificacao() (service_role). Leitura e marcação como lida pelo próprio utilizador.';

-- ---------------------------------------------------------------------
-- 3. Índices
-- ---------------------------------------------------------------------
CREATE INDEX notificacoes_user_id_idx ON public.notificacoes (user_id);
CREATE INDEX notificacoes_user_lida_idx ON public.notificacoes (user_id, lida);

-- ---------------------------------------------------------------------
-- 4. Grants: remover os privilégios por omissão do Supabase e repor só o necessário
-- ---------------------------------------------------------------------
REVOKE ALL ON public.notificacoes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notificacoes TO authenticated;
GRANT UPDATE (lida) ON public.notificacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes TO service_role;

-- ---------------------------------------------------------------------
-- 4. RLS e policies
-- ---------------------------------------------------------------------
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notificacoes_select_proprias ON public.notificacoes
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY notificacoes_update_propria_lida ON public.notificacoes
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Sem policy de INSERT nem DELETE para authenticated; sem policy para anon.

-- ---------------------------------------------------------------------
-- 5. Criação segura: função chamada pelo servidor
-- ---------------------------------------------------------------------
CREATE FUNCTION public.criar_notificacao(
  p_user_id uuid,
  p_tipo text,
  p_titulo text,
  p_corpo text,
  p_canal text,
  p_referencia_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_id uuid;
BEGIN
  IF p_canal NOT IN ('email', 'plataforma', 'whatsapp') THEN
    RAISE EXCEPTION 'Canal inválido' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.notificacoes (user_id, tipo, titulo, corpo, canal, referencia_id)
  VALUES (p_user_id, p_tipo, p_titulo, COALESCE(p_corpo, ''), p_canal, p_referencia_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END
$f$;

REVOKE ALL ON FUNCTION public.criar_notificacao(uuid, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.criar_notificacao(uuid, text, text, text, text, uuid) TO service_role;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) has_table_privilege('authenticated','public.notificacoes','INSERT') -> false
--   b) has_table_privilege('anon','public.notificacoes','SELECT') -> false
--   c) has_function_privilege('authenticated','public.criar_notificacao(uuid,text,text,text,text,uuid)','EXECUTE') -> false
--   d) has_function_privilege('service_role','public.criar_notificacao(uuid,text,text,text,text,uuid)','EXECUTE') -> true
--   e) select policyname, cmd from pg_policies where tablename='notificacoes' -> SELECT e UPDATE apenas
--   f) Como utilizador A, select de notificações de B -> 0 linhas; update de lida em notificação de B -> 0 linhas
-- ---------------------------------------------------------------------
