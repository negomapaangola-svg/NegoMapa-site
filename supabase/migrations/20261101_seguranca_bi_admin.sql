-- =====================================================================
-- B.6.30 — Segurança do BI e dos comprovativos (PROPOSTA, NÃO APLICAR)
-- Projeto: sjelyaewgcmmtnudcgem
-- Aplicar só com autorização explícita e após testes numa branch Supabase.
--
-- Conteúdo:
--   1. obter_bi_foto_proprio()              -> dono lê apenas o caminho da sua foto de BI
--   2. admin_registar_acesso_bi_foto(id)    -> admin: verifica is_admin(), estado 'pendente'
--                                              e foto presente; SÓ DEPOIS regista auditoria
--                                              e devolve o caminho ao servidor (route handler)
--   3. admin_acessos_bi                     -> auditoria append-only (sem caminho, BI, URL, IP ou UA)
--   4. purgar_acessos_bi(meses, confirmar)  -> retenção: só dry-run por defeito; não agendada
--   5. documentos-privados                  -> remove a política ampla do admin; o dono já tem
--                                              SELECT (documentos_privados_select_owner)
--
-- Fonte de admin: public.is_admin() (tabela admin_users), a mesma usada por
-- isAdmin() no código e por admin_avaliar_profissional.
--
-- Acesso ao BI: apenas pela route handler POST /api/admin/bi-foto (streaming).
-- Não existe server action nem RPC que devolva bi_numero.
--
-- Reversão (resumo):
--   DROP POLICY IF EXISTS documentos_privados_select_admin ON storage.objects;
--   CREATE POLICY "documentos-privados_admin_all" ON storage.objects FOR ALL TO authenticated
--     USING (bucket_id = 'documentos-privados' AND public.is_admin())
--     WITH CHECK (bucket_id = 'documentos-privados' AND public.is_admin());
--   DROP FUNCTION IF EXISTS public.purgar_acessos_bi(integer, boolean);
--   DROP FUNCTION IF EXISTS public.admin_registar_acesso_bi_foto(uuid);
--   DROP FUNCTION IF EXISTS public.obter_bi_foto_proprio();
--   DROP FUNCTION IF EXISTS public.caminho_documento_admin_visivel(text);
--   DROP TABLE IF EXISTS public.admin_acessos_bi;
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 3. Tabela de auditoria de acessos ao BI
--    Colunas: quem (admin_user_id), de quem (profissional_id), o quê (campos, sem valores)
--    e quando. NÃO guarda caminho, número de BI, URL assinado, IP nem user-agent.
--    Sem FK para profissionais: o registo sobrevive à eliminação do perfil.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_acessos_bi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  profissional_id uuid NOT NULL,
  campos text[] NOT NULL,
  acessado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_acessos_bi IS
  'Auditoria de acessos à foto de BI por administradores. Escrita apenas por admin_registar_acesso_bi_foto (SECURITY DEFINER). Retenção planeada: 12 meses, com purga manual via purgar_acessos_bi.';

CREATE INDEX IF NOT EXISTS admin_acessos_bi_profissional_idx
  ON public.admin_acessos_bi (profissional_id, acessado_em DESC);

ALTER TABLE public.admin_acessos_bi ENABLE ROW LEVEL SECURITY;

-- Append-only para todos os papéis da API. Escrita só pela função SECURITY DEFINER
-- (dona: postgres) e purga manual pelo dono da base.
REVOKE ALL ON public.admin_acessos_bi FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_acessos_bi FROM service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON public.admin_acessos_bi FROM service_role;
GRANT SELECT ON public.admin_acessos_bi TO authenticated;

DROP POLICY IF EXISTS admin_acessos_bi_select_admin ON public.admin_acessos_bi;
CREATE POLICY admin_acessos_bi_select_admin ON public.admin_acessos_bi
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Sem políticas de INSERT, UPDATE ou DELETE para ninguém.

-- ---------------------------------------------------------------------
-- 1. Dono: caminho da foto do próprio BI (nunca o número, nunca outro utilizador)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obter_bi_foto_proprio()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT p.bi_foto_path
  FROM public.profissionais p
  WHERE p.user_id = auth.uid()
  LIMIT 1
$f$;

REVOKE ALL ON FUNCTION public.obter_bi_foto_proprio() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obter_bi_foto_proprio() TO authenticated;

-- ---------------------------------------------------------------------
-- 2. Admin: autoriza e regista o acesso à foto de BI. Devolve o caminho
--    apenas ao chamador (o route handler do servidor). Nunca devolve o número.
--    Cada verificação falha ANTES do INSERT: pedidos negados não geram linha.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_registar_acesso_bi_foto(p_id uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE  -- escreve na auditoria; não pode ser STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_estado text;
  v_caminho text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  SELECT p.estado, p.bi_foto_path
    INTO v_estado, v_caminho
    FROM public.profissionais p
   WHERE p.id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profissional não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF v_estado <> 'pendente' THEN
    RAISE EXCEPTION 'BI disponível apenas para perfis pendentes' USING ERRCODE = '42501';
  END IF;

  IF v_caminho IS NULL THEN
    RAISE EXCEPTION 'Sem foto de BI' USING ERRCODE = 'P0002';
  END IF;

  -- Auditoria: uma linha por pedido autorizado, incluindo repetidos.
  INSERT INTO public.admin_acessos_bi (admin_user_id, profissional_id, campos)
  VALUES (auth.uid(), p_id, ARRAY['bi_foto']);

  RETURN v_caminho;
END
$f$;

REVOKE ALL ON FUNCTION public.admin_registar_acesso_bi_foto(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_registar_acesso_bi_foto(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. Retenção: purga manual com dry-run. NÃO agendada.
--    Por defeito (p_confirmar = false) apenas conta o que seria apagado.
--    Só o dono da base pode executar (REVOKE a todos os outros papéis).
--    Retenção mínima de 12 meses: valores inferiores são recusados.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purgar_acessos_bi(
  p_meses integer DEFAULT 12,
  p_confirmar boolean DEFAULT false
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_n integer;
BEGIN
  IF p_meses < 12 THEN
    RAISE EXCEPTION 'Retenção mínima de 12 meses' USING ERRCODE = '22023';
  END IF;

  SELECT count(*)::integer INTO v_n
    FROM public.admin_acessos_bi a
   WHERE a.acessado_em < now() - make_interval(months => p_meses);

  IF NOT p_confirmar THEN
    RETURN v_n;  -- dry-run: nenhum registo é apagado
  END IF;

  DELETE FROM public.admin_acessos_bi a
   WHERE a.acessado_em < now() - make_interval(months => p_meses);
  GET DIAGNOSTICS v_n = ROW_COUNT;

  RETURN v_n;
END
$f$;

REVOKE ALL ON FUNCTION public.purgar_acessos_bi(integer, boolean) FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5a. Função auxiliar da política de storage (SECURITY DEFINER para não
--     depender de RLS de profissionais/companies no contexto da política).
--     Admin só vê caminhos vinculados a um perfil de profissional ou a uma empresa.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.caminho_documento_admin_visivel(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
  SELECT public.is_admin()
    AND (
      EXISTS (SELECT 1 FROM public.profissionais p WHERE p.bi_foto_path = p_name)
      OR EXISTS (SELECT 1 FROM public.companies c WHERE c.documento_legalizacao_path = p_name)
    )
$f$;

REVOKE ALL ON FUNCTION public.caminho_documento_admin_visivel(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.caminho_documento_admin_visivel(text) TO authenticated;

-- ---------------------------------------------------------------------
-- 5b. Políticas de storage em documentos-privados
--     Remove a política ampla do admin (SELECT em todo o bucket) e recria-a restrita.
--     O dono já tem SELECT na própria pasta (documentos_privados_select_owner,
--     existente em produção): NÃO é criada outra.
--     Admin passa a apenas LER caminhos vinculados; não escreve nem apaga.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "documentos-privados_admin_all" ON storage.objects;

DROP POLICY IF EXISTS documentos_privados_select_admin ON storage.objects;
CREATE POLICY documentos_privados_select_admin ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos-privados'
    AND public.caminho_documento_admin_visivel(name)
  );

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) has_function_privilege('anon','public.admin_registar_acesso_bi_foto(uuid)','EXECUTE') -> false
--   b) has_function_privilege('authenticated','public.obter_bi_foto_proprio()','EXECUTE') -> true
--   c) has_table_privilege('authenticated','public.admin_acessos_bi','INSERT') -> false
--   d) has_table_privilege('service_role','public.admin_acessos_bi','UPDATE') -> false
--   e) has_table_privilege('service_role','public.admin_acessos_bi','DELETE') -> false
--   f) has_function_privilege('authenticated','public.purgar_acessos_bi(integer,boolean)','EXECUTE') -> false
--   g) select policyname, cmd from pg_policies where schemaname='storage'
--        and tablename='objects' and policyname like 'documentos_privados%'
--        -> documentos_privados_select_owner, documentos_privados_select_admin (sem duplicados)
--   h) select count(*) from pg_policies where policyname='documentos-privados_admin_all' -> 0
--   i) select public.purgar_acessos_bi() -> dry-run (número, sem apagar)
-- ---------------------------------------------------------------------
