-- =====================================================================
-- REVOKE de anon em profissionais: bairro e created_at — NegóMapa
-- PREPARADA, NÃO APLICADA. Aplicar só depois de validar no preview que /servicos e
-- /servico/[slug] funcionam (Tarefa 50).
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102240000_revoke_anon_bairro_created_at_reversao.sql
--
-- Âmbito: remove apenas SELECT de anon nas colunas bairro e created_at de public.profissionais.
-- Não revoga whatsapp, avatar_url, portfolio, disponibilidade*, especialidades,
-- experiencia_faixa nem faixa_preco_desde (são usados pela página pública).
-- Não altera authenticated, políticas RLS, a vista profissionais_publicos nem dados.
-- A vista não usa estas colunas, por isso não é afetada.
-- =====================================================================

BEGIN;

REVOKE SELECT (bairro, created_at) ON public.profissionais FROM anon;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) has_column_privilege('anon','public.profissionais','bairro','SELECT') -> false
--   b) has_column_privilege('anon','public.profissionais','created_at','SELECT') -> false
--   c) has_column_privilege('anon','public.profissionais','whatsapp','SELECT') -> true
--   d) Pedido anónimo direto a profissionais?select=bairro -> erro de permissão (42501)
-- ---------------------------------------------------------------------
