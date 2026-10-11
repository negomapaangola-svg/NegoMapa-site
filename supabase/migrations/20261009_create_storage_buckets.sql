-- Migration: Create Storage Buckets and RLS Policies
-- Date: 2026-10-09

-- Enable RLS on storage.objects (already enabled by default in Supabase)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Create buckets
-- Using INSERT INTO storage.buckets (standard migration approach)
-- Buckets are created with specific configurations via the dashboard or API
-- Here we ensure they exist with correct settings

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('empresas-logos', 'empresas-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('profissionais-avatars', 'profissionais-avatars', true, 1048576, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('servicos-imagens', 'servicos-imagens', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('documentos-privados', 'documentos-privados', false, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS Policies on storage.objects

-- 2.1 PUBLIC SELECT policies (only for the 3 public buckets)

-- empresas-logos: public read access
CREATE POLICY "empresas-logos_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'empresas-logos');

-- profissionais-avatars: public read access
CREATE POLICY "profissionais-avatars_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'profissionais-avatars');

-- servicos-imagens: public read access
CREATE POLICY "servicos-imagens_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'servicos-imagens');

-- documentos-privados: NO public SELECT policy (private bucket)

-- 2.2 INSERT policies (authenticated users only in their own folder)

-- empresas-logos: authenticated users can insert in their own folder
CREATE POLICY "empresas-logos_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'empresas-logos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- profissionais-avatars: authenticated users can insert in their own folder
CREATE POLICY "profissionais-avatars_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profissionais-avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- servicos-imagens: authenticated users can insert in their own folder
CREATE POLICY "servicos-imagens_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'servicos-imagens'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- documentos-privados: authenticated users can insert in their own folder
CREATE POLICY "documentos-privados_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos-privados'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2.3 UPDATE policies (authenticated users only in their own folder)

-- empresas-logos: authenticated users can update in their own folder
CREATE POLICY "empresas-logos_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'empresas-logos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'empresas-logos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- profissionais-avatars: authenticated users can update in their own folder
CREATE POLICY "profissionais-avatars_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profissionais-avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profissionais-avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- servicos-imagens: authenticated users can update in their own folder
CREATE POLICY "servicos-imagens_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'servicos-imagens'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'servicos-imagens'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- documentos-privados: authenticated users can update in their own folder
CREATE POLICY "documentos-privados_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documentos-privados'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documentos-privados'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2.4 DELETE policies (authenticated users only in their own folder)

-- empresas-logos: authenticated users can delete in their own folder
CREATE POLICY "empresas-logos_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'empresas-logos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- profissionais-avatars: authenticated users can delete in their own folder
CREATE POLICY "profissionais-avatars_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profissionais-avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- servicos-imagens: authenticated users can delete in their own folder
CREATE POLICY "servicos-imagens_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'servicos-imagens'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- documentos-privados: authenticated users can delete in their own folder
CREATE POLICY "documentos-privados_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documentos-privados'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2.5 ADMIN full access policies (using existing public.is_admin() function)

-- empresas-logos: admins have full access
CREATE POLICY "empresas-logos_admin_all"
ON storage.objects FOR ALL
USING (bucket_id = 'empresas-logos' AND public.is_admin())
WITH CHECK (bucket_id = 'empresas-logos' AND public.is_admin());

-- profissionais-avatars: admins have full access
CREATE POLICY "profissionais-avatars_admin_all"
ON storage.objects FOR ALL
USING (bucket_id = 'profissionais-avatars' AND public.is_admin())
WITH CHECK (bucket_id = 'profissionais-avatars' AND public.is_admin());

-- servicos-imagens: admins have full access
CREATE POLICY "servicos-imagens_admin_all"
ON storage.objects FOR ALL
USING (bucket_id = 'servicos-imagens' AND public.is_admin())
WITH CHECK (bucket_id = 'servicos-imagens' AND public.is_admin());

-- documentos-privados: admins have full access
CREATE POLICY "documentos-privados_admin_all"
ON storage.objects FOR ALL
USING (bucket_id = 'documentos-privados' AND public.is_admin())
WITH CHECK (bucket_id = 'documentos-privados' AND public.is_admin());