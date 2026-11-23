-- Migração: Storage do módulo de produtos (Fase 2)
-- Projeto: NegóMapa
-- Data: 2026-11-09
--
-- Bucket privado 'produtos'. Não é público: as imagens de produtos pendentes ou
-- rejeitados não podem ser acessíveis por URL direto. A leitura pública faz-se
-- por política, só para imagens de produtos aprovados, com URLs assinados.
--
-- Convenção de caminho: {company_id}/{produto_id}/{ficheiro}
-- Limites: 5 MB por imagem; apenas WebP, JPEG e PNG.
--
-- NÃO APLICAR EM PRODUÇÃO sem aprovação explícita. Testar primeiro num branch Supabase.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'produtos',
  'produtos',
  false,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Leitura pública: só imagens associadas a produtos aprovados de empresas aprovadas.
DROP POLICY IF EXISTS "produtos_storage_select_publico" ON storage.objects;
CREATE POLICY "produtos_storage_select_publico" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'produtos'
    AND EXISTS (
      SELECT 1
      FROM public.produto_imagens pi
      JOIN public.produtos p ON p.id = pi.produto_id
      JOIN public.companies c ON c.id = p.company_id
      WHERE pi.url = storage.objects.name
        AND p.estado_aprovacao = 'aprovado'
        AND c.is_approved = true
    )
  );

-- Leitura da empresa proprietária (inclui pendentes e rejeitados dos seus produtos).
DROP POLICY IF EXISTS "produtos_storage_select_proprietario" ON storage.objects;
CREATE POLICY "produtos_storage_select_proprietario" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'produtos'
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
        AND c.user_id = auth.uid()
    )
  );

-- Upload, substituição e remoção: só a proprietária da empresa, na sua pasta.
DROP POLICY IF EXISTS "produtos_storage_insert_proprietario" ON storage.objects;
CREATE POLICY "produtos_storage_insert_proprietario" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'produtos'
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "produtos_storage_update_proprietario" ON storage.objects;
CREATE POLICY "produtos_storage_update_proprietario" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'produtos'
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'produtos'
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "produtos_storage_delete_proprietario" ON storage.objects;
CREATE POLICY "produtos_storage_delete_proprietario" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'produtos'
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
        AND c.user_id = auth.uid()
    )
  );

-- Administrador: acesso completo ao bucket.
DROP POLICY IF EXISTS "produtos_storage_all_admin" ON storage.objects;
CREATE POLICY "produtos_storage_all_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'produtos' AND public.is_admin())
  WITH CHECK (bucket_id = 'produtos' AND public.is_admin());

COMMIT;
