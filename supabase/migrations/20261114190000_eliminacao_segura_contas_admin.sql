-- Desactivação administrativa reversível por estado, sem apagar registos relacionados.
-- Esta migração é apenas versionada no repositório. Não a aplicar em produção.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text;

CREATE TABLE IF NOT EXISTS public.admin_account_deletion_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  account_id uuid NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('cliente', 'profissional', 'empresa')),
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 10 AND 1000),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  previous_state jsonb NOT NULL,
  new_state jsonb NOT NULL,
  dependency_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  auth_ban_status text NOT NULL DEFAULT 'pending'
    CHECK (auth_ban_status IN ('pending', 'banned', 'failed'))
);

CREATE INDEX IF NOT EXISTS admin_account_deletion_audit_account_idx
  ON public.admin_account_deletion_audit (account_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS admin_account_deletion_audit_occurred_idx
  ON public.admin_account_deletion_audit (occurred_at DESC);

ALTER TABLE public.admin_account_deletion_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_account_deletion_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_account_deletion_audit TO authenticated;
DROP POLICY IF EXISTS admin_read_account_deletion_audit ON public.admin_account_deletion_audit;
CREATE POLICY admin_read_account_deletion_audit
  ON public.admin_account_deletion_audit
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Um administrador desactivado deixa também de satisfazer a verificação central.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users AS a
    JOIN public.profiles AS p ON p.id = a.user_id
    WHERE a.user_id = auth.uid()
      AND p.is_active IS TRUE
  );
$function$;

-- Impede que um utilizador reative a própria conta alterando directamente o perfil.
CREATE OR REPLACE FUNCTION public.protect_profile_deletion_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.id
     AND NOT public.is_admin() THEN
    NEW.is_active := OLD.is_active;
    NEW.deleted_at := OLD.deleted_at;
    NEW.deleted_by := OLD.deleted_by;
    NEW.deletion_reason := OLD.deletion_reason;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.protect_profile_deletion_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_profile_deletion_fields ON public.profiles;
CREATE TRIGGER protect_profile_deletion_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_deletion_fields();

CREATE OR REPLACE FUNCTION public.admin_list_account_deletion_candidates()
RETURNS TABLE (
  account_id uuid,
  display_name text,
  account_type text,
  current_status text,
  is_active boolean,
  dependencies jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(pr.nome, co.name, p.nome, p.id::text),
    COALESCE(p.account_type, 'cliente'),
    CASE WHEN p.is_active THEN 'Activa' ELSE 'Eliminada' END,
    p.is_active,
    CASE COALESCE(p.account_type, 'cliente')
      WHEN 'profissional' THEN jsonb_build_object(
        'servicos', (SELECT count(*) FROM public.servicos s WHERE s.profissional_id = prf.id),
        'pedidos', (SELECT count(*) FROM public.pedidos_servico ps WHERE ps.profissional_id = prf.id),
        'conversas', (SELECT count(*) FROM public.conversas cv WHERE cv.profissional_id = prf.id),
        'mensagens', (SELECT count(*) FROM public.mensagens m WHERE m.remetente_id = p.id OR EXISTS (
          SELECT 1 FROM public.conversas cv WHERE cv.id = m.conversa_id AND cv.profissional_id = prf.id
        )),
        'avaliacoes', (SELECT count(*) FROM public.avaliacoes av WHERE av.profissional_id = prf.id OR av.user_id = p.id),
        'denuncias', (SELECT count(*) FROM public.denuncias d WHERE d.profissional_id = prf.id OR d.user_id = p.id),
        'candidaturas', (SELECT count(*) FROM public.candidaturas ca WHERE ca.user_id = p.id),
        'notificacoes', (SELECT count(*) FROM public.notificacoes n WHERE n.user_id = p.id),
        'preferencias', (SELECT count(*) FROM public.preferencias_notificacao pn WHERE pn.user_id = p.id),
        'mensagens_administrativas', (SELECT count(*) FROM public.admin_messages am WHERE am.sender_id = p.id OR am.recipient_id = p.id)
      )
      WHEN 'empresa' THEN jsonb_build_object(
        'vagas', (SELECT count(*) FROM public.vagas v WHERE v.company_id = co.id),
        'produtos', (SELECT count(*) FROM public.produtos pd WHERE pd.company_id = co.id),
        'conversas', (SELECT count(*) FROM public.conversas cv WHERE cv.empresa_id = co.id),
        'mensagens', (SELECT count(*) FROM public.mensagens m WHERE m.remetente_id = p.id OR EXISTS (
          SELECT 1 FROM public.conversas cv WHERE cv.id = m.conversa_id AND cv.empresa_id = co.id
        )),
        'candidaturas', (SELECT count(*) FROM public.candidaturas ca JOIN public.vagas v ON v.id = ca.vaga_id WHERE v.company_id = co.id),
        'avaliacoes', (SELECT count(*) FROM public.avaliacoes av WHERE av.company_id = co.id OR av.user_id = p.id),
        'denuncias', (SELECT count(*) FROM public.denuncias d WHERE d.company_id = co.id OR d.user_id = p.id),
        'notificacoes', (SELECT count(*) FROM public.notificacoes n WHERE n.user_id = p.id),
        'preferencias', (SELECT count(*) FROM public.preferencias_notificacao pn WHERE pn.user_id = p.id),
        'mensagens_administrativas', (SELECT count(*) FROM public.admin_messages am WHERE am.sender_id = p.id OR am.recipient_id = p.id)
      )
      ELSE jsonb_build_object(
        'candidaturas', (SELECT count(*) FROM public.candidaturas ca WHERE ca.user_id = p.id),
        'pedidos', (SELECT count(*) FROM public.pedidos_servico ps WHERE ps.cliente_id = p.id),
        'conversas', (SELECT count(*) FROM public.conversas cv WHERE cv.cliente_id = p.id),
        'mensagens', (SELECT count(*) FROM public.mensagens m WHERE m.remetente_id = p.id OR EXISTS (
          SELECT 1 FROM public.conversas cv WHERE cv.id = m.conversa_id AND cv.cliente_id = p.id
        )),
        'avaliacoes', (SELECT count(*) FROM public.avaliacoes av WHERE av.user_id = p.id),
        'denuncias', (SELECT count(*) FROM public.denuncias d WHERE d.user_id = p.id),
        'preferencias', (SELECT count(*) FROM public.preferencias_cliente pc WHERE pc.user_id = p.id),
        'notificacoes', (SELECT count(*) FROM public.notificacoes n WHERE n.user_id = p.id),
        'mensagens_administrativas', (SELECT count(*) FROM public.admin_messages am WHERE am.sender_id = p.id OR am.recipient_id = p.id),
        'preferencias_notificacao', (SELECT count(*) FROM public.preferencias_notificacao pn WHERE pn.user_id = p.id)
      )
    END
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT x.id, x.nome
    FROM public.profissionais x
    WHERE x.user_id = p.id
    ORDER BY x.created_at DESC
    LIMIT 1
  ) prf ON true
  LEFT JOIN LATERAL (
    SELECT x.id, x.name
    FROM public.companies x
    WHERE x.user_id = p.id
    ORDER BY x.created_at DESC
    LIMIT 1
  ) co ON true
  LEFT JOIN public.profissionais pr ON pr.id = prf.id
  WHERE (p.account_type IN ('cliente', 'profissional', 'empresa') OR p.account_type IS NULL)
    AND NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = p.id)
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_deactivate_account(
  p_account_id uuid,
  p_account_type text,
  p_reason text,
  p_confirm boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_audit_id uuid := gen_random_uuid();
  v_dependencies jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  IF p_confirm IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Confirmação explícita obrigatória' USING ERRCODE = '22023';
  END IF;
  IF p_account_id IS NULL OR p_account_id = auth.uid() THEN
    RAISE EXCEPTION 'Conta inválida ou não é permitido eliminar a própria conta' USING ERRCODE = '22023';
  END IF;
  IF p_account_type NOT IN ('cliente', 'profissional', 'empresa') THEN
    RAISE EXCEPTION 'Tipo de conta inválido' USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NULL OR char_length(btrim(p_reason)) < 10 OR char_length(btrim(p_reason)) > 1000 THEN
    RAISE EXCEPTION 'O motivo deve ter entre 10 e 1000 caracteres' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = p_account_id) THEN
    RAISE EXCEPTION 'As contas administrativas não podem ser eliminadas por esta acção' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF COALESCE(v_profile.account_type, 'cliente') <> p_account_type THEN
    RAISE EXCEPTION 'O tipo de conta não corresponde ao registo actual' USING ERRCODE = '22023';
  END IF;
  IF v_profile.is_active IS FALSE THEN
    RAISE EXCEPTION 'A conta já se encontra eliminada ou desactivada' USING ERRCODE = '22023';
  END IF;

  SELECT c.dependencies INTO v_dependencies
  FROM public.admin_list_account_deletion_candidates() c
  WHERE c.account_id = p_account_id;

  UPDATE public.profiles
  SET is_active = false,
      deleted_at = now(),
      deleted_by = auth.uid(),
      deletion_reason = btrim(p_reason),
      updated_at = now()
  WHERE id = p_account_id;

  INSERT INTO public.admin_account_deletion_audit (
    id, admin_id, account_id, account_type, reason, previous_state, new_state, dependency_counts
  ) VALUES (
    v_audit_id,
    auth.uid(),
    p_account_id,
    p_account_type,
    btrim(p_reason),
    jsonb_build_object(
      'is_active', v_profile.is_active,
      'account_type', v_profile.account_type,
      'deleted_at', v_profile.deleted_at
    ),
    jsonb_build_object(
      'is_active', false,
      'status', 'Eliminada',
      'deleted_at', now()
    ),
    COALESCE(v_dependencies, '{}'::jsonb)
  );

  RETURN jsonb_build_object('audit_id', v_audit_id, 'account_id', p_account_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_account_deletion_auth_status(
  p_audit_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('banned', 'failed') THEN
    RAISE EXCEPTION 'Estado de autenticação inválido' USING ERRCODE = '22023';
  END IF;
  UPDATE public.admin_account_deletion_audit
  SET auth_ban_status = p_status
  WHERE id = p_audit_id;
  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_account_deletion_candidates() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_deactivate_account(uuid, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_account_deletion_auth_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_account_deletion_candidates() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deactivate_account(uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_account_deletion_auth_status(uuid, text) TO authenticated;

-- As vistas públicas mantêm as colunas existentes e excluem contas desactivadas.
CREATE OR REPLACE VIEW public.empresas_publicas AS
SELECT
  c.id, c.name, c.slug, c.sector, c.province, c.city, c.bairro, c.rua,
  c.referencia_localizacao, c.description, c.horario_atendimento, c.is_verified,
  c.is_approved, c.whatsapp, c.logo_url, c.portfolio
FROM public.companies c
WHERE c.is_approved = true
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = c.user_id AND p.is_active = true);

CREATE OR REPLACE VIEW public.profissionais_publicos AS
SELECT
  p.id, p.nome, p.slug, p.categoria_id, c.nome AS categoria, p.provincia,
  p.municipio, p.anos_experiencia, p.bio, p.whatsapp, p.avatar_url, p.portfolio,
  p.disponibilidade_dias, p.disponibilidade_horarios, p.especialidades,
  p.experiencia_faixa, p.faixa_preco_desde
FROM public.profissionais p
LEFT JOIN public.categorias c ON c.id = p.categoria_id
WHERE p.estado = 'aprovado'
  AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.user_id AND pr.is_active = true);

CREATE OR REPLACE VIEW public.vagas_publicas AS
SELECT
  v.id, v.company_id, v.titulo, v.slug, v.descricao, v.requisitos, v.categoria,
  v.provincia, v.municipio, v.tipo_contrato, v.salario, v.estado, v.created_at
FROM public.vagas v
WHERE v.estado = 'aprovado'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    JOIN public.profiles p ON p.id = c.user_id
    WHERE c.id = v.company_id AND c.is_approved = true AND p.is_active = true
  );

CREATE OR REPLACE VIEW public.produtos_publicos AS
SELECT
  p.id, p.categoria_id, p.titulo, p.slug, p.descricao, p.preco, p.preco_tipo,
  p.estado_produto, p.entrega, p.provincia, p.municipio, p.criado_em
FROM public.produtos p
WHERE p.estado_aprovacao = 'aprovado'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    JOIN public.profiles pr ON pr.id = c.user_id
    WHERE c.id = p.company_id AND c.is_approved = true AND pr.is_active = true
  );

CREATE OR REPLACE VIEW public.produto_imagens_publicas AS
SELECT pi.id, pi.produto_id, pi.url, pi.ordem
FROM public.produto_imagens pi
WHERE EXISTS (
  SELECT 1
  FROM public.produtos p
  JOIN public.companies c ON c.id = p.company_id
  JOIN public.profiles pr ON pr.id = c.user_id
  WHERE p.id = pi.produto_id
    AND p.estado_aprovacao = 'aprovado'
    AND c.is_approved = true
    AND pr.is_active = true
);
