-- =====================================================================
-- REVERSÃO — normalização das províncias (migração 20261102160000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- A migração só alterou um registo: companies.province da empresa "Serafim"
-- (id d06cdfee-1c85-4043-a1e1-e11ce74280bf) de 'Luanda ' (com espaço final) para 'Luanda'.
-- Como 'Luanda' também é o valor de outros registos, a reversão usa o id e não uma regra geral.
-- A alteração só acontece se o valor atual ainda for 'Luanda'; caso contrário aborta tudo.
-- Não altera municípios, políticas, RPCs, código nem outras tabelas.
-- =====================================================================

BEGIN;

DO $r$
DECLARE
  v_n integer;
BEGIN
  UPDATE public.companies
     SET province = 'Luanda '
   WHERE id = 'd06cdfee-1c85-4043-a1e1-e11ce74280bf'
     AND province = 'Luanda';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'Reversão: esperado 1 registo com province ''Luanda'', alterados %. Abortar.', v_n;
  END IF;
END
$r$;

COMMIT;
