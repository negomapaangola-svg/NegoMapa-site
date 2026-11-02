-- =====================================================================
-- REVERSÃO — casos pendentes de categorias (migração 20261102150000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- Repõe, por id, os 3 registos alterados para os valores anteriores:
--   1. Serviço 'Professor' (305b8532-…): Formação e explicações -> Carpinteiro
--   2. Vaga 'Assistente Administrativo' (28b71538-…): Recursos humanos e recrutamento -> Administração
--   3. Vaga 'Motorista de Teste' (761f66c9-…): Mudanças e transporte de mercadorias -> Transportes
--
-- Cada alteração só acontece se o registo ainda estiver no valor novo; caso contrário aborta tudo.
-- Não altera o serviço de teste, nem Moto-taxi / Telemóveis e reparações.
-- =====================================================================

BEGIN;

DO $r$
DECLARE
  v_formacao_id uuid;
  v_carpinteiro_id uuid;
  v_n integer;
BEGIN
  SELECT id INTO v_formacao_id FROM public.categorias WHERE nome = 'Formação e explicações';
  SELECT id INTO v_carpinteiro_id FROM public.categorias WHERE nome = 'Carpinteiro';

  IF v_formacao_id IS NULL OR v_carpinteiro_id IS NULL THEN
    RAISE EXCEPTION 'Categorias de referência em falta. Reversão cancelada.';
  END IF;

  UPDATE public.servicos
     SET categoria_id = v_carpinteiro_id
   WHERE id = '305b8532-614e-4b5f-b7a1-9db36b1723ce'
     AND categoria_id = v_formacao_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'Serviço Professor: esperado 1 registo com Formação e explicações, alterados %. Abortar.', v_n;
  END IF;

  UPDATE public.vagas
     SET categoria = 'Administração'
   WHERE id = '28b71538-43de-4c49-ad05-a6b2c14039a4'
     AND categoria = 'Recursos humanos e recrutamento';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'Vaga Assistente Administrativo: esperado 1 registo com Recursos humanos e recrutamento, alterados %. Abortar.', v_n;
  END IF;

  UPDATE public.vagas
     SET categoria = 'Transportes'
   WHERE id = '761f66c9-b03c-4881-bd27-affa116ffb63'
     AND categoria = 'Mudanças e transporte de mercadorias';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'Vaga Motorista de Teste: esperado 1 registo com Mudanças e transporte de mercadorias, alterados %. Abortar.', v_n;
  END IF;
END
$r$;

COMMIT;
