BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (
    account_type IS NULL
    OR account_type IN (
      'cliente',
      'profissional',
      'empresa'
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user_profile_b2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, account_type)
  VALUES (NEW.id, 'cliente')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION
  public.handle_new_user_profile_b2()
FROM PUBLIC, anon, authenticated;

COMMIT;
