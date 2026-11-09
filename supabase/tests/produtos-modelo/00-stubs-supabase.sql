-- Stubs mínimos que imitam o Supabase, só para testar as migrações localmente.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets(id), name text
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT string_to_array(name, '/')
$$;

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  is_approved boolean DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, slug text NOT NULL, ativo boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.admin_users (user_id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
$$;

-- Como o Supabase: privilégios amplos por defeito em public (o que a migração tem de revogar).
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid(), storage.foldername(text), public.is_admin() TO anon, authenticated;
