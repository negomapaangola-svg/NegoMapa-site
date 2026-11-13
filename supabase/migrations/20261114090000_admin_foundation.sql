-- Fundação administrativa fase 1
-- Fonte de autorização única: public.admin_users através de public.is_admin().
-- Não elimina nem reclassifica dados existentes.

BEGIN;

-- 1. Corrige a divergência: admin_obter_empresa passa a consultar a mesma
-- fonte de verdade usada por isAdmin(), RLS e restantes RPCs administrativas.
CREATE OR REPLACE FUNCTION public.admin_obter_empresa(p_id uuid)
RETURNS SETOF public.companies
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT c.*
      FROM public.companies AS c
     WHERE c.id = p_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_obter_empresa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_obter_empresa(uuid) TO authenticated;

-- 2. Mensagens próprias para contacto com a administração.
-- Uma mensagem inicial tem recipient_id NULL; apenas o administrador pode
-- responder (recipient_id preenchido). Conversas privadas existentes não são abertas.
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid NULL REFERENCES public.admin_messages(id) ON DELETE SET NULL,
  subject text NOT NULL CHECK (length(btrim(subject)) BETWEEN 3 AND 160),
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL,
  archived_at timestamptz NULL,
  CONSTRAINT admin_messages_not_self CHECK (recipient_id IS NULL OR recipient_id <> sender_id)
);

CREATE INDEX IF NOT EXISTS admin_messages_inbox_idx
  ON public.admin_messages (created_at DESC)
  WHERE recipient_id IS NULL;

CREATE INDEX IF NOT EXISTS admin_messages_sender_idx
  ON public.admin_messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_messages_recipient_idx
  ON public.admin_messages (recipient_id, created_at DESC)
  WHERE recipient_id IS NOT NULL;

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_messages TO authenticated;
GRANT ALL ON public.admin_messages TO service_role;

DROP POLICY IF EXISTS admin_messages_select_admin ON public.admin_messages;
CREATE POLICY admin_messages_select_admin
  ON public.admin_messages
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS admin_messages_select_own ON public.admin_messages;
CREATE POLICY admin_messages_select_own
  ON public.admin_messages
  FOR SELECT TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR recipient_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS admin_messages_insert_user ON public.admin_messages;
CREATE POLICY admin_messages_insert_user
  ON public.admin_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND recipient_id IS NULL
    AND parent_id IS NULL
  );

DROP POLICY IF EXISTS admin_messages_insert_admin_reply ON public.admin_messages;
CREATE POLICY admin_messages_insert_admin_reply
  ON public.admin_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    AND sender_id = (SELECT auth.uid())
    AND recipient_id IS NOT NULL
    AND parent_id IS NOT NULL
  );

DROP POLICY IF EXISTS admin_messages_update_admin ON public.admin_messages;
CREATE POLICY admin_messages_update_admin
  ON public.admin_messages
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Não há política UPDATE para utilizadores comuns: só administradores marcam
-- leitura/arquivo na caixa de entrada. O utilizador pode apenas consultar as próprias mensagens.

-- 3. Serviços e vagas deixam de exigir aprovação administrativa.
-- Novos registos ficam imediatamente aprovados; a alteração manual do estado
-- continua reservada a administradores. Profissionais continuam pendentes.
CREATE OR REPLACE FUNCTION public.proteger_estado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF TG_TABLE_NAME IN ('servicos', 'vagas') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.estado := 'aprovado';
      RETURN NEW;
    END IF;

    IF public.is_admin() THEN
      RETURN NEW;
    END IF;

    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o estado';
    END IF;
    RETURN NEW;
  END IF;

  -- Profissionais continuam sujeitos à avaliação administrativa.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.estado := 'pendente';
    RETURN NEW;
  END IF;

  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o estado';
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Produtos: aprovação automática quando a primeira imagem é registada.
-- O registo do produto é criado primeiro e as imagens são anexadas depois.
-- A aprovação só ocorre quando existe pelo menos uma linha produto_imagens.
CREATE OR REPLACE FUNCTION public.produtos_proteger_estado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  total_imagens integer;
  aprovacao_automatica boolean := false;
BEGIN
  IF NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.criado_por := auth.uid();
      NEW.estado_aprovacao := 'pendente';
      NEW.motivo_rejeicao := NULL;
      NEW.avaliado_em := NULL;
      NEW.avaliado_por := NULL;
    ELSE
      IF NEW.estado_aprovacao IS DISTINCT FROM OLD.estado_aprovacao
         OR NEW.motivo_rejeicao IS DISTINCT FROM OLD.motivo_rejeicao
         OR NEW.avaliado_em IS DISTINCT FROM OLD.avaliado_em
         OR NEW.avaliado_por IS DISTINCT FROM OLD.avaliado_por THEN
        -- A única transição não administrativa aceite é a chamada aninhada
        -- do trigger de primeira imagem, e apenas com imagem já registada.
        IF NEW.estado_aprovacao = 'aprovado'
           AND pg_trigger_depth() > 1
           AND EXISTS (
             SELECT 1 FROM public.produto_imagens pi
              WHERE pi.produto_id = NEW.id
           ) THEN
          aprovacao_automatica := true;
        ELSE
          RAISE EXCEPTION 'Sem permissão para alterar a aprovação do produto.'
            USING ERRCODE = '42501';
        END IF;
      END IF;

      IF NEW.company_id IS DISTINCT FROM OLD.company_id
         OR NEW.criado_por IS DISTINCT FROM OLD.criado_por THEN
        RAISE EXCEPTION 'Sem permissão para alterar a empresa ou o criador do produto.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF aprovacao_automatica THEN
    NEW.motivo_rejeicao := NULL;
    NEW.avaliado_em := now();
    NEW.avaliado_por := NULL;
  END IF;

  IF NEW.estado_aprovacao = 'aprovado'
     AND (TG_OP = 'INSERT' OR NEW.estado_aprovacao IS DISTINCT FROM OLD.estado_aprovacao) THEN
    SELECT count(*) INTO total_imagens
      FROM public.produto_imagens
     WHERE produto_id = NEW.id;

    IF total_imagens < 1 THEN
      RAISE EXCEPTION 'O produto precisa de pelo menos 1 imagem para ser publicado.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.aprovar_produto_apos_primeira_imagem()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.produtos
     SET estado_aprovacao = 'aprovado'
   WHERE id = NEW.produto_id
     AND estado_aprovacao IS DISTINCT FROM 'aprovado'
     AND EXISTS (
       SELECT 1 FROM public.produto_imagens pi
        WHERE pi.produto_id = NEW.produto_id
     );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.aprovar_produto_apos_primeira_imagem() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_produto_aprovar_apos_primeira_imagem ON public.produto_imagens;
CREATE TRIGGER trg_produto_aprovar_apos_primeira_imagem
  AFTER INSERT ON public.produto_imagens
  FOR EACH ROW
  EXECUTE FUNCTION public.aprovar_produto_apos_primeira_imagem();

COMMIT;

-- Verificações pós-aplicação (a executar em ambiente de teste):
-- * RPC admin_obter_empresa falha com 42501 para não-admin e usa public.is_admin().
-- * Utilizador comum cria mensagem inicial e só lê mensagens em que participa.
-- * Utilizador comum não consegue inserir resposta nem alterar read_at/archived_at.
-- * Administrador lê inbox, responde e arquiva.
-- * Novo serviço/vaga entra com estado aprovado; profissional continua pendente.
-- * Produto só passa a aprovado após a primeira imagem; não-admin não pode forçar estado.
