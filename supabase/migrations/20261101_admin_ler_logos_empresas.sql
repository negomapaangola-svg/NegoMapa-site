-- NÃO APLICADA. Revisar e aplicar manualmente antes de testar o logótipo no detalhe admin.
-- Permite ao administrador gerar URL assinado para o logótipo (bucket privado empresas-logos).
-- Hoje só o dono (imagens_dono_select) e a política imagens_publicas_aprovadas podem ler.

CREATE POLICY "empresas_logos_select_admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'empresas-logos' AND public.is_admin());
