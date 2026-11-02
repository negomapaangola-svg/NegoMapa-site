-- =====================================================================
-- Normalização das províncias — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102160000_normalizar_provincias_reversao.sql
--
-- Âmbito: companies.province, profissionais.provincia, servicos.provincia, vagas.provincia.
-- Não altera municípios, políticas, RPCs, código nem outras tabelas.
--
-- Mapa (tabela temporária tmp_mapa_provincias): valor atual, valor normalizado e contagem esperada.
-- Valores encontrados em produção (leitura, data de preparação):
--   companies:     'Benguela' (1), 'Luanda' (11), 'Luanda ' com espaço final (1)
--   profissionais: 'Luanda' (2)
--   servicos:      'Bengo' (2), 'Bié' (1)
--     Bengo (2): serviço 'Professor' (305b8532-…, criado 2026-11-01) e serviço 'Gerir empresas'
--     (5fe0ac07-…, criado 2026-11-02). Ambos com provincia = 'Bengo', valor oficial, já normalizado;
--     não são alterados por esta migração. Corrigido na Tarefa 41 (contagem esperada 1 -> 2).
--   vagas:         'Luanda' (2)
-- Única alteração real: companies 'Luanda ' -> 'Luanda' (id d06cdfee-1c85-4043-a1e1-e11ce74280bf, empresa "Serafim", aprovada).
-- Os restantes valores já são o nome oficial e ficam como identidade no mapa.
--
-- Abortos (tudo é revertido):
--   a) valor fora do mapa em qualquer uma das quatro colunas (incluindo NULL);
--   b) contagem real diferente da contagem esperada;
--   c) valor normalizado que não esteja na lista oficial das 21 províncias;
--   d) número de linhas alteradas diferente do esperado.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Tabelas temporárias (existem só nesta sessão)
-- ---------------------------------------------------------------------
CREATE TEMP TABLE tmp_provincias_oficiais (
  nome text PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO tmp_provincias_oficiais (nome) VALUES
  ('Bengo'), ('Benguela'), ('Bié'), ('Cabinda'), ('Cuando'), ('Cubango'),
  ('Cuanza Norte'), ('Cuanza Sul'), ('Cunene'), ('Huambo'), ('Huíla'),
  ('Icolo e Bengo'), ('Luanda'), ('Lunda Norte'), ('Lunda Sul'), ('Malanje'),
  ('Moxico'), ('Moxico Leste'), ('Namibe'), ('Uíge'), ('Zaire');

CREATE TEMP TABLE tmp_mapa_provincias (
  tabela text NOT NULL,
  valor_atual text NOT NULL,
  valor_normalizado text NOT NULL,
  contagem_esperada integer NOT NULL,
  PRIMARY KEY (tabela, valor_atual)
) ON COMMIT DROP;

INSERT INTO tmp_mapa_provincias (tabela, valor_atual, valor_normalizado, contagem_esperada) VALUES
  ('companies',     'Benguela',  'Benguela',  1),
  ('companies',     'Luanda',    'Luanda',    11),
  ('companies',     'Luanda ',   'Luanda',    1),
  ('profissionais', 'Luanda',    'Luanda',    2),
  ('servicos',      'Bengo',     'Bengo',     2),
  ('servicos',      'Bié',       'Bié',       1),
  ('vagas',         'Luanda',    'Luanda',    2);

-- ---------------------------------------------------------------------
-- Contagens reais por tabela e valor
-- ---------------------------------------------------------------------
CREATE TEMP TABLE tmp_contagens_reais (
  tabela text NOT NULL,
  valor_atual text,
  contagem_real integer NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_contagens_reais (tabela, valor_atual, contagem_real)
SELECT 'companies', province, count(*)::integer FROM public.companies GROUP BY province
UNION ALL
SELECT 'profissionais', provincia, count(*)::integer FROM public.profissionais GROUP BY provincia
UNION ALL
SELECT 'servicos', provincia, count(*)::integer FROM public.servicos GROUP BY provincia
UNION ALL
SELECT 'vagas', provincia, count(*)::integer FROM public.vagas GROUP BY provincia;

DO $guardas$
DECLARE
  v_n integer;
BEGIN
  -- a) valores (incluindo NULL) fora do mapa
  SELECT count(*)::integer INTO v_n
    FROM tmp_contagens_reais r
   WHERE NOT EXISTS (
     SELECT 1 FROM tmp_mapa_provincias m
      WHERE m.tabela = r.tabela AND m.valor_atual IS NOT DISTINCT FROM r.valor_atual
   );
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Abortar: % combinação(ões) tabela/valor fora do mapa de províncias.', v_n;
  END IF;

  -- b) contagem real diferente da esperada (inclui entradas do mapa sem linhas)
  SELECT count(*)::integer INTO v_n
    FROM tmp_mapa_provincias m
    LEFT JOIN tmp_contagens_reais r
      ON r.tabela = m.tabela AND r.valor_atual = m.valor_atual
   WHERE COALESCE(r.contagem_real, 0) <> m.contagem_esperada;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Abortar: % contagem(ns) diferente(s) do esperado.', v_n;
  END IF;

  -- c) valor normalizado fora da lista oficial
  SELECT count(*)::integer INTO v_n
    FROM tmp_mapa_provincias m
   WHERE NOT EXISTS (SELECT 1 FROM tmp_provincias_oficiais o WHERE o.nome = m.valor_normalizado);
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Abortar: % valor(es) normalizado(s) não estão na lista oficial.', v_n;
  END IF;
END
$guardas$;

-- ---------------------------------------------------------------------
-- Normalização (só onde o valor muda) com verificação do número de linhas
-- ---------------------------------------------------------------------
DO $normalizar$
DECLARE
  v_esperado integer;
  v_n integer;
BEGIN
  -- companies.province
  SELECT COALESCE(sum(m.contagem_esperada), 0)::integer INTO v_esperado
    FROM tmp_mapa_provincias m
   WHERE m.tabela = 'companies' AND m.valor_atual <> m.valor_normalizado;
  UPDATE public.companies c
     SET province = m.valor_normalizado
    FROM tmp_mapa_provincias m
   WHERE m.tabela = 'companies'
     AND c.province = m.valor_atual
     AND m.valor_atual <> m.valor_normalizado;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> v_esperado THEN
    RAISE EXCEPTION 'companies: esperado alterar %, alterados %. Abortar.', v_esperado, v_n;
  END IF;

  -- profissionais.provincia
  SELECT COALESCE(sum(m.contagem_esperada), 0)::integer INTO v_esperado
    FROM tmp_mapa_provincias m
   WHERE m.tabela = 'profissionais' AND m.valor_atual <> m.valor_normalizado;
  UPDATE public.profissionais p
     SET provincia = m.valor_normalizado
    FROM tmp_mapa_provincias m
   WHERE m.tabela = 'profissionais'
     AND p.provincia = m.valor_atual
     AND m.valor_atual <> m.valor_normalizado;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> v_esperado THEN
    RAISE EXCEPTION 'profissionais: esperado alterar %, alterados %. Abortar.', v_esperado, v_n;
  END IF;

  -- servicos.provincia
  SELECT COALESCE(sum(m.contagem_esperada), 0)::integer INTO v_esperado
    FROM tmp_mapa_provincias m
   WHERE m.tabela = 'servicos' AND m.valor_atual <> m.valor_normalizado;
  UPDATE public.servicos s
     SET provincia = m.valor_normalizado
    FROM tmp_mapa_provincias m
   WHERE m.tabela = 'servicos'
     AND s.provincia = m.valor_atual
     AND m.valor_atual <> m.valor_normalizado;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> v_esperado THEN
    RAISE EXCEPTION 'servicos: esperado alterar %, alterados %. Abortar.', v_esperado, v_n;
  END IF;

  -- vagas.provincia
  SELECT COALESCE(sum(m.contagem_esperada), 0)::integer INTO v_esperado
    FROM tmp_mapa_provincias m
   WHERE m.tabela = 'vagas' AND m.valor_atual <> m.valor_normalizado;
  UPDATE public.vagas v
     SET provincia = m.valor_normalizado
    FROM tmp_mapa_provincias m
   WHERE m.tabela = 'vagas'
     AND v.provincia = m.valor_atual
     AND m.valor_atual <> m.valor_normalizado;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> v_esperado THEN
    RAISE EXCEPTION 'vagas: esperado alterar %, alterados %. Abortar.', v_esperado, v_n;
  END IF;
END
$normalizar$;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) select province, count(*) from companies group by province  -> 'Luanda' 12, sem 'Luanda '
--   b) select count(*) from companies where province <> btrim(province) -> 0
--   c) distinct de provincia em profissionais, servicos e vagas -> só valores oficiais
-- ---------------------------------------------------------------------
