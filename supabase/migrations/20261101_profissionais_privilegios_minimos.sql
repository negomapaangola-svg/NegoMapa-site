-- Privilégios mínimos em public.profissionais.
-- Remove privilégios de tabela perigosos (TRUNCATE não passa por RLS) e restringe
-- INSERT a authenticated às colunas que o cadastro usa.
-- Não altera SELECT público, políticas RLS, nem dados. Aprovação (estado) continua
-- protegida pelo trigger proteger_estado.

-- 1. Privilégios de tabela
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.profissionais FROM anon;
REVOKE TRUNCATE, TRIGGER ON TABLE public.profissionais FROM authenticated;
REVOKE INSERT ON TABLE public.profissionais FROM authenticated;

-- 2. Privilégios de coluna: anon sem INSERT/UPDATE/REFERENCES; authenticated sem INSERT herdado.
--    SELECT nunca é revogado.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT grantee, column_name, privilege_type
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name = 'profissionais'
      AND privilege_type IN ('INSERT', 'UPDATE', 'REFERENCES')
      AND (grantee = 'anon' OR (grantee = 'authenticated' AND privilege_type = 'INSERT'))
  LOOP
    EXECUTE format(
      'REVOKE %s (%I) ON TABLE public.profissionais FROM %I',
      r.privilege_type, r.column_name, r.grantee
    );
  END LOOP;
END
$$;

-- 3. authenticated: INSERT só nas colunas usadas por createProfile (servicos.ts) e pelas 7 novas.
--    estado é enviado como 'pendente' e forçado pelo trigger proteger_estado.
GRANT INSERT (
  user_id, nome, slug, telefone, whatsapp, bio, provincia, municipio, estado,
  avatar_url, bi_numero, anos_experiencia, disponibilidade_dias,
  disponibilidade_horarios, portfolio,
  bairro, categoria_id, especialidades, experiencia_faixa,
  faixa_preco_desde, disponibilidade, bi_foto_path
) ON TABLE public.profissionais TO authenticated;

-- authenticated mantém DELETE (own), REFERENCES, UPDATE por coluna e SELECT: não alterados.
