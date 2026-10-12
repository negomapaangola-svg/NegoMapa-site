-- Migration: Add profile completion fields to profissionais table
-- Date: 2026-10-12

ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS bi_numero text,
ADD COLUMN IF NOT EXISTS anos_experiencia smallint,
ADD COLUMN IF NOT EXISTS disponibilidade_dias text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS disponibilidade_horarios jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS portfolio jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profissionais.bi_numero IS 'Número do Bilhete de Identidade angolano';
COMMENT ON COLUMN public.profissionais.anos_experiencia IS 'Anos de experiência profissional';
COMMENT ON COLUMN public.profissionais.disponibilidade_dias IS 'Dias da semana disponíveis (ex: {seg,qua,sex})';
COMMENT ON COLUMN public.profissionais.disponibilidade_horarios IS 'Horários disponíveis (ex: {manha: true, tarde: false, noite: true})';
COMMENT ON COLUMN public.profissionais.portfolio IS 'Portfolio de trabalhos (array de objetos)';