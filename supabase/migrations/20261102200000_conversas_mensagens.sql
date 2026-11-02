-- =====================================================================
-- Conversas e mensagens — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102200000_conversas_mensagens_reversao.sql
--
-- Modelo:
--   - Uma conversa liga um CLIENTE (utilizador) a UM interlocutor: um profissional OU uma empresa.
--     A CHECK obriga a exatamente um dos dois.
--   - Só o cliente inicia a conversa, e só com profissional aprovado ou empresa aprovada.
--     Não sendo exigida candidatura, qualquer cliente autenticado pode iniciar conversa com um
--     interlocutor aprovado (decisão a confirmar). Um utilizador com várias funções pode iniciar
--     como cliente. A empresa, enquanto empresa, não inicia conversas: a conversa não pode ter como
--     cliente o próprio dono do interlocutor (Tarefa 25).
--   - Mensagens têm remetente, conteúdo, lida_em e criada_em.
--
-- RLS:
--   - Conversas: participantes (cliente, utilizador do profissional, utilizador da empresa) leem;
--     administrador lê tudo. Criação só pelo cliente, nas condições acima. Sem UPDATE nem DELETE.
--   - Mensagens: participantes leem e escrevem (remetente_id = auth.uid()); administrador lê tudo.
--     Só o destinatário (não o remetente) pode marcar lida_em, por GRANT de coluna.
--     Sem UPDATE de conteúdo, sem DELETE.
--
-- Fora do âmbito: páginas, componentes, notificações, e-mails, tempo real (Realtime).
-- Dependências: public.profissionais, public.companies, public.is_admin().
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------
CREATE TABLE public.conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id uuid NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  empresa_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  criada_em timestamptz NOT NULL DEFAULT now(),
  -- Exatamente um interlocutor
  CONSTRAINT conversas_um_interlocutor CHECK ((profissional_id IS NULL) <> (empresa_id IS NULL))
);

COMMENT ON TABLE public.conversas IS
  'Conversa entre um cliente e um profissional ou uma empresa. Criada apenas pelo cliente.';

-- Uma conversa por par cliente-interlocutor
CREATE UNIQUE INDEX conversas_cliente_profissional_uq
  ON public.conversas (cliente_id, profissional_id) WHERE profissional_id IS NOT NULL;
CREATE UNIQUE INDEX conversas_cliente_empresa_uq
  ON public.conversas (cliente_id, empresa_id) WHERE empresa_id IS NOT NULL;

CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo text NOT NULL CHECK (length(btrim(conteudo)) BETWEEN 1 AND 4000),
  lida_em timestamptz NULL,
  criada_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mensagens IS
  'Mensagens de uma conversa. lida_em é preenchido pelo destinatário.';

CREATE INDEX mensagens_conversa_criada_idx ON public.mensagens (conversa_id, criada_em);

-- ---------------------------------------------------------------------
-- Funções auxiliares (SECURITY DEFINER evita recursão com RLS de conversas, profissionais e companies)
-- ---------------------------------------------------------------------
CREATE FUNCTION public.conversa_participante(p_conversa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT EXISTS (
    SELECT 1
      FROM public.conversas c
     WHERE c.id = p_conversa_id
       AND (
         c.cliente_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = c.profissional_id AND p.user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.companies e WHERE e.id = c.empresa_id AND e.user_id = auth.uid())
       )
  )
$f$;

CREATE FUNCTION public.perfil_profissional_aprovado(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = p_id AND p.estado = 'aprovado')
$f$;

CREATE FUNCTION public.empresa_aprovada(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT EXISTS (SELECT 1 FROM public.companies e WHERE e.id = p_id AND e.is_approved = true)
$f$;

REVOKE ALL ON FUNCTION public.conversa_participante(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.conversa_participante(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.perfil_profissional_aprovado(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.perfil_profissional_aprovado(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.empresa_aprovada(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_aprovada(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------
REVOKE ALL ON public.conversas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.conversas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversas TO service_role;

REVOKE ALL ON public.mensagens FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.mensagens TO authenticated;
GRANT UPDATE (lida_em) ON public.mensagens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens TO service_role;

-- ---------------------------------------------------------------------
-- RLS: conversas
-- ---------------------------------------------------------------------
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversas_select_participante ON public.conversas
  FOR SELECT TO authenticated
  USING ((SELECT public.conversa_participante(id)));

CREATE POLICY conversas_select_admin ON public.conversas
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- Só o cliente inicia, e só com interlocutor aprovado
CREATE POLICY conversas_insert_cliente ON public.conversas
  FOR INSERT TO authenticated
  WITH CHECK (
    cliente_id = (SELECT auth.uid())
    -- Sem auto-conversa: o cliente não pode ser o dono do interlocutor escolhido
    AND (empresa_id IS NULL OR empresa_id NOT IN (
          SELECT e.id FROM public.companies e WHERE e.user_id = (SELECT auth.uid())))
    AND (profissional_id IS NULL OR profissional_id NOT IN (
          SELECT p.id FROM public.profissionais p WHERE p.user_id = (SELECT auth.uid())))
    AND (
      (profissional_id IS NOT NULL AND public.perfil_profissional_aprovado(profissional_id))
      OR (empresa_id IS NOT NULL AND public.empresa_aprovada(empresa_id))
    )
  );

-- ---------------------------------------------------------------------
-- RLS: mensagens
-- ---------------------------------------------------------------------
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY mensagens_select_participante ON public.mensagens
  FOR SELECT TO authenticated
  USING ((SELECT public.conversa_participante(conversa_id)));

CREATE POLICY mensagens_select_admin ON public.mensagens
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- Participante escreve como remetente
CREATE POLICY mensagens_insert_participante ON public.mensagens
  FOR INSERT TO authenticated
  WITH CHECK (
    remetente_id = (SELECT auth.uid())
    AND (SELECT public.conversa_participante(conversa_id))
    AND lida_em IS NULL
  );

-- Destinatário marca como lida (nunca o próprio remetente); só a coluna lida_em
CREATE POLICY mensagens_update_lida_destinatario ON public.mensagens
  FOR UPDATE TO authenticated
  USING (
    remetente_id <> (SELECT auth.uid())
    AND (SELECT public.conversa_participante(conversa_id))
  )
  WITH CHECK (
    remetente_id <> (SELECT auth.uid())
    AND (SELECT public.conversa_participante(conversa_id))
  );

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) Profissional tenta criar conversa -> recusado pela RLS (só cliente)
--   b) Cliente cria conversa com profissional não aprovado -> recusado
--   c) Participante de outra conversa -> 0 linhas em mensagens
--   d) Remetente tenta marcar lida_em na própria mensagem -> 0 linhas
--   e) Admin lê todas as conversas e mensagens; não consegue inserir mensagens
--   f) has_column_privilege('authenticated','public.mensagens','conteudo','UPDATE') -> false
--   g) Dono de empresa (ou de perfil) tenta conversa com o próprio interlocutor como cliente -> recusado pela RLS
--   h) Utilizador sem ligação à conversa: select em conversas e mensagens -> 0 linhas
--   i) Cliente e interlocutor (profissional ou empresa aprovados) leem e respondem na conversa
-- ---------------------------------------------------------------------
