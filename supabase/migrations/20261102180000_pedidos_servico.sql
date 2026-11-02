-- =====================================================================
-- Pedidos de serviço — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102180000_pedidos_servico_reversao.sql
--
-- Conteúdo:
--   1. Tabela public.pedidos_servico (nova).
--   2. Estados: novo, em_analise, aceite, recusado, concluido, cancelado.
--   3. Transições permitidas validadas por trigger (para qualquer papel que altere o estado).
--   3b. Coerência de servico_id (Tarefas 22 e 25): se indicado, o serviço tem de estar aprovado, pertencer
--       ao profissional_id indicado, e este tem de estar aprovado. Um pedido com servico_id exige
--       profissional_id (CHECK). Profissional e serviço referenciados por pedidos têm ON DELETE RESTRICT:
--       não são apagados nem anulados em silêncio enquanto existirem pedidos que os referenciem.
--       Pedidos sem serviço continuam a seguir o modelo atual (profissional_id opcional).
--   4. RLS:
--        - Cliente: lê e cria os próprios pedidos (cliente_id = auth.uid()); na criação o estado é 'novo'.
--        - Profissional aprovado: lê os pedidos que lhe foram dirigidos; atualiza apenas a coluna estado.
--        - Administrador (is_admin()): lê todos os pedidos.
--   5. Grants por coluna: o profissional só tem UPDATE em estado.
--
-- Fora do âmbito: páginas, componentes, e-mails, notificações.
-- Cliente: UPDATE só para cancelar o próprio pedido em 'novo' ou 'em_analise' (Tarefa 15B).
-- Administrador: só leitura. Ninguém tem DELETE.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tabela
-- ---------------------------------------------------------------------
CREATE TABLE public.pedidos_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id uuid NULL REFERENCES public.profissionais(id) ON DELETE RESTRICT,
  servico_id uuid NULL REFERENCES public.servicos(id) ON DELETE RESTRICT,
  provincia text NOT NULL CHECK (provincia IN (
    'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando', 'Cubango', 'Cuanza Norte', 'Cuanza Sul',
    'Cunene', 'Huambo', 'Huíla', 'Icolo e Bengo', 'Luanda', 'Lunda Norte', 'Lunda Sul',
    'Malanje', 'Moxico', 'Moxico Leste', 'Namibe', 'Uíge', 'Zaire')),
  titulo text NOT NULL CHECK (length(btrim(titulo)) BETWEEN 3 AND 200),
  descricao text NOT NULL CHECK (length(btrim(descricao)) BETWEEN 10 AND 2000),
  data_preferida date NULL,
  orcamento numeric(12, 2) NULL CHECK (orcamento IS NULL OR orcamento >= 0),
  contacto text NOT NULL CHECK (length(btrim(contacto)) BETWEEN 3 AND 120),
  estado text NOT NULL DEFAULT 'novo' CHECK (estado IN (
    'novo', 'em_analise', 'aceite', 'recusado', 'concluido', 'cancelado')),
  criada_em timestamptz NOT NULL DEFAULT now(),
  -- Um pedido dirigido a um serviço tem sempre profissional_id.
  -- A coerência serviço/profissional/aprovação é validada pelo trigger pedidos_servico_validar_servico.
  CONSTRAINT pedidos_servico_servico_exige_profissional CHECK (servico_id IS NULL OR profissional_id IS NOT NULL)
);

COMMENT ON TABLE public.pedidos_servico IS
  'Pedidos de serviço feitos por clientes. Estado alterado pelo profissional segundo transições validadas por trigger.';

CREATE INDEX pedidos_servico_cliente_id_idx ON public.pedidos_servico (cliente_id);
CREATE INDEX pedidos_servico_profissional_estado_idx ON public.pedidos_servico (profissional_id, estado);

-- ---------------------------------------------------------------------
-- 2 e 3. Transições de estado (validadas para qualquer papel)
-- ---------------------------------------------------------------------
CREATE FUNCTION public.validar_transicao_pedido()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $f$
DECLARE
  v_permitidas text[];
BEGIN
  IF NEW.estado IS NOT DISTINCT FROM OLD.estado THEN
    RETURN NEW;
  END IF;

  v_permitidas := CASE OLD.estado
    WHEN 'novo'        THEN ARRAY['em_analise', 'aceite', 'recusado', 'cancelado']
    WHEN 'em_analise'  THEN ARRAY['aceite', 'recusado', 'cancelado']
    WHEN 'aceite'      THEN ARRAY['concluido', 'cancelado']
    ELSE ARRAY[]::text[]  -- recusado, concluido e cancelado são estados finais
  END;

  IF NOT (NEW.estado = ANY (v_permitidas)) THEN
    RAISE EXCEPTION 'Transição de estado não permitida: % -> %', OLD.estado, NEW.estado
      USING ERRCODE = '22023';
  END IF;

  -- Cancelamento de novo ou em_analise: só o próprio cliente.
  -- service_role (auth.uid() nulo) continua permitido para correções operacionais.
  IF NEW.estado = 'cancelado' AND OLD.estado IN ('novo', 'em_analise')
     AND auth.uid() IS NOT NULL AND auth.uid() <> OLD.cliente_id THEN
    RAISE EXCEPTION 'Só o cliente pode cancelar um pedido em % ', OLD.estado
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$f$;

CREATE TRIGGER pedidos_servico_validar_transicao
  BEFORE UPDATE OF estado ON public.pedidos_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_transicao_pedido();

-- ---------------------------------------------------------------------
-- 3b. Coerência de servico_id com profissional_id e aprovações (Tarefa 22)
-- ---------------------------------------------------------------------
CREATE FUNCTION public.validar_servico_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
BEGIN
  IF NEW.servico_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sem profissional não há serviço válido: rejeita em vez de limpar servico_id em silêncio.
  IF NEW.profissional_id IS NULL THEN
    RAISE EXCEPTION 'Um pedido dirigido a um serviço exige profissional_id'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profissionais p
     WHERE p.id = NEW.profissional_id AND p.estado = 'aprovado'
  ) THEN
    RAISE EXCEPTION 'O profissional do pedido não está aprovado'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.servicos s
     WHERE s.id = NEW.servico_id
       AND s.profissional_id = NEW.profissional_id
       AND s.estado = 'aprovado'
  ) THEN
    RAISE EXCEPTION 'O serviço do pedido não está aprovado ou não pertence ao profissional indicado'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$f$;

REVOKE ALL ON FUNCTION public.validar_servico_pedido() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER pedidos_servico_validar_servico
  BEFORE INSERT OR UPDATE OF servico_id, profissional_id ON public.pedidos_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_servico_pedido();

-- ---------------------------------------------------------------------
-- Funções auxiliares para as policies (SECURITY DEFINER evita recursão com RLS de profissionais)
-- ---------------------------------------------------------------------
CREATE FUNCTION public.profissional_aprovado_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT p.id
    FROM public.profissionais p
   WHERE p.user_id = auth.uid()
     AND p.estado = 'aprovado'
   LIMIT 1
$f$;

CREATE FUNCTION public.profissional_aprovado(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT EXISTS (
    SELECT 1 FROM public.profissionais p
     WHERE p.id = p_id AND p.estado = 'aprovado'
  )
$f$;

REVOKE ALL ON FUNCTION public.profissional_aprovado_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profissional_aprovado_id() TO authenticated;
REVOKE ALL ON FUNCTION public.profissional_aprovado(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profissional_aprovado(uuid) TO authenticated;

-- A função de trigger não deve ser chamada diretamente por ninguém.
REVOKE ALL ON FUNCTION public.validar_transicao_pedido() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Grants: remover privilégios por omissão e repor só o necessário
-- ---------------------------------------------------------------------
REVOKE ALL ON public.pedidos_servico FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.pedidos_servico TO authenticated;
GRANT UPDATE (estado) ON public.pedidos_servico TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_servico TO service_role;

-- ---------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.pedidos_servico ENABLE ROW LEVEL SECURITY;

-- Cliente: vê os próprios pedidos
CREATE POLICY pedidos_servico_select_cliente ON public.pedidos_servico
  FOR SELECT TO authenticated
  USING (cliente_id = (SELECT auth.uid()));

-- Cliente: cancela o próprio pedido apenas quando está em 'novo' ou 'em_analise'.
-- USING: a linha tem de estar nesses estados (não há reabertura de pedidos finais).
-- WITH CHECK: só pode passar a 'cancelado'. Outros campos não têm GRANT (só estado).
CREATE POLICY pedidos_servico_update_cliente_cancelar ON public.pedidos_servico
  FOR UPDATE TO authenticated
  USING (
    cliente_id = (SELECT auth.uid())
    AND estado IN ('novo', 'em_analise')
  )
  WITH CHECK (
    cliente_id = (SELECT auth.uid())
    AND estado = 'cancelado'
  );

-- Cliente: cria pedidos próprios, em estado 'novo', dirigidos a profissional aprovado (ou sem profissional)
CREATE POLICY pedidos_servico_insert_cliente ON public.pedidos_servico
  FOR INSERT TO authenticated
  WITH CHECK (
    cliente_id = (SELECT auth.uid())
    AND estado = 'novo'
    AND (profissional_id IS NULL OR public.profissional_aprovado(profissional_id))
  );

-- Profissional aprovado: vê os pedidos que lhe foram dirigidos
CREATE POLICY pedidos_servico_select_profissional ON public.pedidos_servico
  FOR SELECT TO authenticated
  USING (profissional_id IS NOT NULL AND profissional_id = (SELECT public.profissional_aprovado_id()));

-- Profissional aprovado: atualiza apenas o estado dos pedidos que lhe foram dirigidos
-- (a coluna é limitada por GRANT e o estado por trigger)
CREATE POLICY pedidos_servico_update_profissional ON public.pedidos_servico
  FOR UPDATE TO authenticated
  USING (profissional_id IS NOT NULL AND profissional_id = (SELECT public.profissional_aprovado_id()))
  WITH CHECK (profissional_id IS NOT NULL AND profissional_id = (SELECT public.profissional_aprovado_id()));

-- Administrador: vê tudo
CREATE POLICY pedidos_servico_select_admin ON public.pedidos_servico
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) has_table_privilege('anon','public.pedidos_servico','SELECT') -> false
--   b) has_column_privilege('authenticated','public.pedidos_servico','cliente_id','UPDATE') -> false
--   c) has_column_privilege('authenticated','public.pedidos_servico','estado','UPDATE') -> true
--   d) Profissional aprovado: update de estado novo -> aceite: ok; aceite -> novo: erro 22023
--   e) Cliente: insert com estado 'aceite' -> recusado pela RLS
--   f) Profissional não aprovado: select -> 0 linhas
--   g) Pedido com servico_id e profissional_id nulo -> erro 23514 (CHECK)
--   h) Pedido com servico_id de outro profissional, ou profissional não aprovado -> erro 42501 (trigger)
--   i) DELETE de profissional ou serviço referenciado por pedidos -> erro 23503 (ON DELETE RESTRICT)
-- ---------------------------------------------------------------------
