BEGIN;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS motivo_decisao text,
  ADD COLUMN IF NOT EXISTS decidido_em timestamptz,
  ADD COLUMN IF NOT EXISTS decidido_por uuid;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_estado_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_estado_check
  CHECK (
    estado IS NULL
    OR estado IN (
      'pendente',
      'aprovado',
      'rejeitado',
      'suspenso'
    )
  );

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_decidido_por_fkey;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_decidido_por_fkey
  FOREIGN KEY (decidido_por)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.companies
  ALTER COLUMN estado SET DEFAULT 'pendente';

COMMIT;
