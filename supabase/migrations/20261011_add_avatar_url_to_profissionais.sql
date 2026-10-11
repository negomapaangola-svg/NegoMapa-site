-- Migration: Add avatar_url column to profissionais table
-- Date: 2026-10-11

ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN public.profissionais.avatar_url IS 'URL pública do avatar do profissional (storage bucket profissionais-avatars)';