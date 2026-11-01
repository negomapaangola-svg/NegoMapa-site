-- Detalhe admin de empresa sem abrir colunas sensíveis a authenticated.
-- authenticated não tem SELECT em nif, logo_url, whatsapp, website,
-- documento_legalizacao_path (migração 20261028). Esta função é SECURITY DEFINER
-- e só devolve a linha se o chamador for administrador (profiles.is_admin).

CREATE OR REPLACE FUNCTION public.admin_obter_empresa(p_id uuid)
RETURNS SETOF public.companies
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY SELECT c.* FROM public.companies c WHERE c.id = p_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_obter_empresa(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_obter_empresa(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_obter_empresa(uuid) TO authenticated;
