-- Migração: Adicionar campos de legalização e localização detalhada à tabela companies
-- Data: 2026-10-21
-- Descrição: Adiciona colunas para NIF, estado de legalização, documento, horário e endereço detalhado

-- ============================================================================
-- TABELA: companies - Novas colunas
-- ============================================================================

ALTER TABLE IF EXISTS public.companies
ADD COLUMN IF NOT EXISTS nif text;

ALTER TABLE IF EXISTS public.companies
ADD COLUMN IF NOT EXISTS estado_legalizacao text;

ALTER TABLE IF EXISTS public.companies
ADD COLUMN IF NOT EXISTS documento_legalizacao_url text;

ALTER TABLE IF EXISTS public.companies
ADD COLUMN IF NOT EXISTS horario_atendimento text;

ALTER TABLE IF NOT EXISTS public.companies
ADD COLUMN IF NOT EXISTS bairro text;

ALTER TABLE IF NOT EXISTS public.companies
ADD COLUMN IF NOT EXISTS rua text;

ALTER TABLE IF NOT EXISTS public.companies
ADD COLUMN IF NOT EXISTS referencia_localizacao text;

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================