-- Fase C1: privacidade de produtos/vagas, localização privada e preferências de cliente.
-- Sem backfill, reclassificação ou eliminação de registos existentes.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS localizacao_provincia text,
  ADD COLUMN IF NOT EXISTS localizacao_municipio text,
  ADD COLUMN IF NOT EXISTS localizacao_bairro text,
  ADD COLUMN IF NOT EXISTS consentimento_localizacao boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consentimento_actualizado_em timestamptz,
  ADD COLUMN IF NOT EXISTS latitude_aproximada numeric(5,2),
  ADD COLUMN IF NOT EXISTS longitude_aproximada numeric(5,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_coordenadas_com_consentimento_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_coordenadas_com_consentimento_chk
      CHECK (
        (latitude_aproximada IS NULL AND longitude_aproximada IS NULL)
        OR (
          consentimento_localizacao IS TRUE
          AND latitude_aproximada IS NOT NULL
          AND longitude_aproximada IS NOT NULL
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_coordenadas_intervalo_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_coordenadas_intervalo_chk
      CHECK (
        (latitude_aproximada IS NULL OR latitude_aproximada BETWEEN -90 AND 90)
        AND
        (longitude_aproximada IS NULL OR longitude_aproximada BETWEEN -180 AND 180)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.preferencias_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT preferencias_cliente_user_categoria_uk UNIQUE (user_id, categoria_id)
);

CREATE INDEX IF NOT EXISTS idx_preferencias_cliente_user_id
  ON public.preferencias_cliente(user_id);

ALTER TABLE public.preferencias_cliente ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.preferencias_cliente FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.preferencias_cliente TO authenticated;

DROP POLICY IF EXISTS preferencias_cliente_select_proprio ON public.preferencias_cliente;
CREATE POLICY preferencias_cliente_select_proprio
  ON public.preferencias_cliente FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS preferencias_cliente_insert_proprio ON public.preferencias_cliente;
CREATE POLICY preferencias_cliente_insert_proprio
  ON public.preferencias_cliente FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS preferencias_cliente_update_proprio ON public.preferencias_cliente;
CREATE POLICY preferencias_cliente_update_proprio
  ON public.preferencias_cliente FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS preferencias_cliente_delete_proprio ON public.preferencias_cliente;
CREATE POLICY preferencias_cliente_delete_proprio
  ON public.preferencias_cliente FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Vista segura. SECURITY INVOKER preserva as políticas RLS da tabela produtos.
CREATE OR REPLACE VIEW public.produtos_publicos
WITH (security_invoker = true)
AS
SELECT
  id,
  categoria_id,
  titulo,
  slug,
  descricao,
  preco,
  preco_tipo,
  estado_produto,
  entrega,
  provincia,
  municipio,
  criado_em
FROM public.produtos;

GRANT SELECT ON TABLE public.produtos_publicos TO anon, authenticated;

-- Remove privilégios públicos amplos e reabre apenas colunas necessárias à vista.
REVOKE ALL PRIVILEGES ON TABLE public.produtos FROM anon, PUBLIC;
REVOKE SELECT (whatsapp, motivo_rejeicao, criado_por, avaliado_por, avaliado_em, estado_aprovacao)
  ON TABLE public.produtos FROM anon, PUBLIC;
GRANT SELECT (
  id, categoria_id, titulo, slug, descricao, preco, preco_tipo,
  estado_produto, entrega, provincia, municipio, criado_em
) ON TABLE public.produtos TO anon;

-- A vista existente é SECURITY INVOKER e necessita apenas destas colunas.
REVOKE ALL PRIVILEGES ON TABLE public.vagas FROM anon, PUBLIC;
REVOKE SELECT (whatsapp, motivo_rejeicao, avaliado_por, avaliado_em)
  ON TABLE public.vagas FROM anon, PUBLIC;
GRANT SELECT (
  id, company_id, titulo, slug, descricao, requisitos, categoria,
  provincia, municipio, tipo_contrato, salario, estado, created_at
) ON TABLE public.vagas TO anon;
GRANT SELECT ON TABLE public.vagas_publicas TO anon, authenticated;
