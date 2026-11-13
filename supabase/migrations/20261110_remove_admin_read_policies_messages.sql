-- Remove acesso administrativo amplo a conversas e mensagens.
-- Apenas participantes autorizados podem ler conversas e mensagens.
-- Reversão de emergência:
-- CREATE POLICY conversas_select_admin
-- ON public.conversas
-- FOR SELECT
-- TO authenticated
-- USING (is_admin());
--
-- CREATE POLICY mensagens_select_admin
-- ON public.mensagens
-- FOR SELECT
-- TO authenticated
-- USING (is_admin());

DROP POLICY IF EXISTS conversas_select_admin
ON public.conversas;

DROP POLICY IF EXISTS mensagens_select_admin
ON public.mensagens;
