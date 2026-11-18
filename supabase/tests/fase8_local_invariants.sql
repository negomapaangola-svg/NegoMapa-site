-- Fase 8: invariantes estruturais do Supabase local descartável.
-- Não cria utilizadores nem objectos Storage. Não altera nem elimina dados.
DO $fase8$
DECLARE
  v_expected text[] := ARRAY[
    'clientes-avatars',
    'company-files',
    'documentos-privados',
    'empresas',
    'empresas-logos',
    'empresas-portfolio',
    'produtos',
    'profissionais',
    'profissionais-avatars',
    'profissionais-portfolio',
    'servicos',
    'vagas'
  ];
  v_missing text[];
  v_public text[];
  v_extra text[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'auth' AND tablename = 'users'
  ) THEN
    RAISE EXCEPTION 'Auth: auth.users não existe no stack local';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Storage: RLS não está activa em storage.objects';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    WHERE t.schemaname = 'public' AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS desactivada em pelo menos uma tabela de public';
  END IF;

  SELECT array_agg(x) INTO v_missing
  FROM unnest(v_expected) x
  WHERE NOT EXISTS (SELECT 1 FROM storage.buckets b WHERE b.name = x);
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Buckets de produção ausentes no stack local: %', v_missing;
  END IF;

  SELECT array_agg(name) INTO v_public
  FROM storage.buckets
  WHERE name = ANY(v_expected) AND public IS DISTINCT FROM false;
  IF v_public IS NOT NULL THEN
    RAISE EXCEPTION 'Buckets que não estão privados: %', v_public;
  END IF;

  SELECT array_agg(name) INTO v_extra
  FROM storage.buckets
  WHERE NOT (name = ANY(v_expected));
  IF v_extra IS NOT NULL THEN
    RAISE EXCEPTION 'Buckets locais não existentes em produção (drift): %', v_extra;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'storage'
      AND p.tablename = 'objects'
      AND p.roles && ARRAY['public', 'anon']::name[]
      AND (
        p.qual ILIKE '%empresas-logos%'
        OR p.qual ILIKE '%profissionais-avatars%'
        OR p.qual ILIKE '%servicos-imagens%'
        OR p.qual ILIKE '%vagas-capas%'
      )
  ) THEN
    RAISE EXCEPTION 'Existe policy de leitura anónima/PUBLIC para bucket de imagem privado';
  END IF;
END
$fase8$;
