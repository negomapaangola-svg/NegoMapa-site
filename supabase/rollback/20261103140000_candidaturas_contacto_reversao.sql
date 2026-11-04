-- REVERSÃO de 20261103140000_candidaturas_contacto.sql
-- ATENÇÃO: remove a coluna contacto e TODOS os contactos guardados nela. Não reversível sem backup.
-- Só executar se a migração tiver sido aplicada e for necessário desfazê-la.

ALTER TABLE public.candidaturas
  DROP CONSTRAINT IF EXISTS candidaturas_contacto_tamanho;

ALTER TABLE public.candidaturas
  DROP COLUMN IF EXISTS contacto;
