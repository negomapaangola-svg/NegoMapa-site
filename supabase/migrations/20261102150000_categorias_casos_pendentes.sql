-- =====================================================================
-- Casos pendentes de categorias — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- DEPENDÊNCIA: só aplicar DEPOIS de 20261102140000_categorias_oficiais.sql
--   (cria 'Recursos humanos e recrutamento' e 'Mudanças e transporte de mercadorias'
--   e renomeia 'Aulas particulares' para 'Formação e explicações').
-- Reversão: supabase/rollback/20261102150000_categorias_casos_pendentes_reversao.sql
--
-- Alterações (apenas os 3 registos indicados, por id):
--   1. Serviço 'Professor' (305b8532-…): categoria Carpinteiro -> Formação e explicações.
--   2. Vaga 'Assistente Administrativo' (28b71538-…): categoria 'Administração' -> 'Recursos humanos e recrutamento'.
--   3. Vaga 'Motorista de Teste' (761f66c9-…): categoria 'Transportes' -> 'Mudanças e transporte de mercadorias'.
--
-- Não altera: serviço 'Serviço Teste B6.24'; Moto-taxi e Telemóveis e reparações (continuam desativadas);
-- políticas; RPCs; províncias; código; outros registos.
-- Cada UPDATE exige que o registo ainda esteja no valor esperado; caso contrário, aborta tudo.
-- =====================================================================

BEGIN;

DO $f$
DECLARE
  v_formacao_id uuid;
  v_carpinteiro_id uuid;
  v_n integer;
BEGIN
  -- Pré-condições: categorias de destino existem e estão ativas
  IF NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Formação e explicações' AND ativo) THEN
    RAISE EXCEPTION 'Categoria ''Formação e explicações'' não existe ou está inativa. Aplicar 20261102140000 primeiro.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Recursos humanos e recrutamento' AND ativo) THEN
    RAISE EXCEPTION 'Categoria ''Recursos humanos e recrutamento'' não existe ou está inativa. Aplicar 20261102140000 primeiro.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Mudanças e transporte de mercadorias' AND ativo) THEN
    RAISE EXCEPTION 'Categoria ''Mudanças e transporte de mercadorias'' não existe ou está inativa. Aplicar 20261102140000 primeiro.';
  END IF;

  SELECT id INTO v_formacao_id FROM public.categorias WHERE nome = 'Formação e explicações';
  SELECT id INTO v_carpinteiro_id FROM public.categorias WHERE nome = 'Carpinteiro';

  -- 1. Serviço 'Professor'
  UPDATE public.servicos
     SET categoria_id = v_formacao_id
   WHERE id = '305b8532-614e-4b5f-b7a1-9db36b1723ce'
     AND categoria_id = v_carpinteiro_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'Serviço Professor: esperado 1 registo com categoria Carpinteiro, alterados %. Abortar.', v_n;
  END IF;

  -- 2. Vaga 'Assistente Administrativo'
  UPDATE public.vagas
     SET categoria = 'Recursos humanos e recrutamento'
   WHERE id = '28b71538-43de-4c49-ad05-a6b2c14039a4'
     AND categoria = 'Administração';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'Vaga Assistente Administrativo: esperado 1 registo com categoria Administração, alterados %. Abortar.', v_n;
  END IF;

  -- 3. Vaga 'Motorista de Teste'
  UPDATE public.vagas
     SET categoria = 'Mudanças e transporte de mercadorias'
   WHERE id = '761f66c9-b03c-4881-bd27-affa116ffb63'
     AND categoria = 'Transportes';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'Vaga Motorista de Teste: esperado 1 registo com categoria Transportes, alterados %. Abortar.', v_n;
  END IF;
END
$f$;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) select s.titulo, c.nome from servicos s join categorias c on c.id = s.categoria_id
--        where s.id = '305b8532-614e-4b5f-b7a1-9db36b1723ce'  -> Formação e explicações
--   b) select id, titulo, categoria from vagas
--        where id in ('28b71538-43de-4c49-ad05-a6b2c14039a4','761f66c9-b03c-4881-bd27-affa116ffb63')
--        -> Recursos humanos e recrutamento / Mudanças e transporte de mercadorias
--   c) select s.titulo, c.nome from servicos s join categorias c on c.id = s.categoria_id
--        where s.id = 'b18f7b79-87f4-42fb-bf80-407a36157325'  -> Formação e explicações (inalterado)
--   d) select nome, ativo from categorias where nome in ('Moto-taxi','Telemóveis e reparações')  -> ativo = false
-- ---------------------------------------------------------------------
