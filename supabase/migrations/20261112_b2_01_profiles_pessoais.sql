BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET DEFAULT now();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile_b2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION
  public.handle_new_user_profile_b2()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_auth_users_create_profile_b2
ON auth.users;

CREATE TRIGGER trg_auth_users_create_profile_b2
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile_b2();

CREATE OR REPLACE FUNCTION public.touch_profile_updated_at_b2()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at_b2
ON public.profiles;

CREATE TRIGGER trg_profiles_updated_at_b2
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.touch_profile_updated_at_b2();

COMMIT;
