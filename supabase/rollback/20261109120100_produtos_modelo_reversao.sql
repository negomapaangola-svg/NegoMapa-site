-- Reversão da Fase 2 (modelo de produtos). Só usar se a migração tiver sido aplicada e for preciso desfazê-la.
-- Apaga os produtos e as imagens (dados incluídos). Antes de executar, confirmar com o responsável.

BEGIN;

DROP FUNCTION IF EXISTS public.admin_avaliar_produto(uuid, text, text);

DROP POLICY IF EXISTS "produtos_storage_all_admin" ON storage.objects;
DROP POLICY IF EXISTS "produtos_storage_delete_proprietario" ON storage.objects;
DROP POLICY IF EXISTS "produtos_storage_update_proprietario" ON storage.objects;
DROP POLICY IF EXISTS "produtos_storage_insert_proprietario" ON storage.objects;
DROP POLICY IF EXISTS "produtos_storage_select_proprietario" ON storage.objects;
DROP POLICY IF EXISTS "produtos_storage_select_publico" ON storage.objects;

DROP TABLE IF EXISTS public.produto_imagens;
DROP TABLE IF EXISTS public.produtos;
DROP FUNCTION IF EXISTS public.produtos_proteger_estado();
DROP FUNCTION IF EXISTS public.produtos_actualizar_timestamp();
DROP FUNCTION IF EXISTS public.produto_imagens_validar_limite();
DROP FUNCTION IF EXISTS public.produto_imagens_validar_minimo();

-- Remove o bucket só se estiver vazio (não apaga ficheiros).
DELETE FROM storage.buckets WHERE id = 'produtos' AND NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'produtos');

COMMIT;
