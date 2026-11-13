-- Remove all write-capable privileges from public projection views.
-- Public and authenticated consumers retain read-only access.
-- This migration intentionally does not modify base tables, RLS policies,
-- authentication, triggers, or SECURITY DEFINER functions.

REVOKE ALL PRIVILEGES ON TABLE
  public.produtos_publicos,
  public.vagas_publicas,
  public.produto_imagens_publicas
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.produtos_publicos,
  public.vagas_publicas,
  public.produto_imagens_publicas
TO anon, authenticated;
