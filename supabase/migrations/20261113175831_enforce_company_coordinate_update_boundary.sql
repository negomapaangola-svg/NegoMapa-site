BEGIN;

-- Retira o UPDATE ao nível da tabela, que se sobrepõe a qualquer REVOKE
-- de coluna. Reabre UPDATE em todas as colunas existentes excepto coordenadas.
REVOKE UPDATE ON TABLE public.companies FROM authenticated;
REVOKE UPDATE (latitude_aproximada, longitude_aproximada)
ON TABLE public.companies FROM authenticated;

DO $$
DECLARE
  colunas_editaveis text;
BEGIN
  SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
    INTO colunas_editaveis
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'companies'
    AND column_name NOT IN ('latitude_aproximada', 'longitude_aproximada');

  IF colunas_editaveis IS NOT NULL THEN
    EXECUTE format(
      'GRANT UPDATE (%s) ON TABLE public.companies TO authenticated',
      colunas_editaveis
    );
  END IF;
END
$$;

COMMIT;
