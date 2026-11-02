-- =====================================================================
-- Categorias oficiais (documento consolidado, §3.2) — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102140000_categorias_oficiais_reversao.sql
--
-- Alterações (apenas na tabela categorias; serviços e vagas não são alterados):
--   1. Renomeia 15 categorias existentes para o nome oficial. Os slugs NÃO mudam,
--      para não quebrar URLs e filtros. Os serviços continuam ligados por id.
--   2. Insere as 12 categorias oficiais em falta, com ativo = true.
--   3. Desativa (sem apagar) Moto-taxi e Telemóveis e reparações, apenas se não
--      tiverem serviços, vagas nem profissionais associados. Se tiverem, ficam ativas.
--   4. Não toca em: Carpinteiro, Eletricista e Pintor (já têm o nome oficial),
--      vagas, serviços, profissionais, políticas, RPCs nem províncias.
--
-- Casos que exigem decisão (NÃO tratados aqui): ver relatório da Tarefa 11.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Renomear categorias existentes para o nome oficial
-- ---------------------------------------------------------------------
DO $renomear$
DECLARE
  v_n integer;
BEGIN
  WITH mapa(antigo, novo) AS (
    VALUES
      ('Aulas particulares',      'Formação e explicações'),
      ('Cabeleireiro',            'Cabeleireiro e barbearia'),
      ('Construção civil',        'Alvenaria e construção civil'),
      ('Contabilidade',           'Contabilidade e fiscalidade'),
      ('Costureira',              'Costura, moda e alfaiataria'),
      ('Encanador',               'Canalizador'),
      ('Fotógrafo',               'Fotografia e vídeo'),
      ('Informática e reparação', 'Informática e manutenção de computadores'),
      ('Jardinagem',              'Jardinagem e paisagismo'),
      ('Limpeza',                 'Limpeza doméstica e empresarial'),
      ('Manicure e pedicure',     'Estética, manicure e pedicure'),
      ('Marketing digital',       'Marketing digital e redes sociais'),
      ('Mecânico',                'Mecânico automóvel'),
      ('Motorista',               'Motorista e transporte particular'),
      ('Tradução',                'Tradução e revisão de textos')
  )
  UPDATE public.categorias c
     SET nome = m.novo
    FROM mapa m
   WHERE c.nome = m.antigo;

  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 15 THEN
    RAISE EXCEPTION 'Renomeação esperava 15 categorias e alterou % — abortar', v_n;
  END IF;
END
$renomear$;

-- ---------------------------------------------------------------------
-- 2. Inserir as 12 categorias oficiais em falta
-- ---------------------------------------------------------------------
INSERT INTO public.categorias (nome, slug, ativo)
VALUES
  ('Serralheiro',                                   'serralheiro',                        true),
  ('Ar condicionado e refrigeração',                'ar-condicionado-refrigeracao',       true),
  ('Mudanças e transporte de mercadorias',          'mudancas-transporte-mercadorias',    true),
  ('Electrónica e reparação de eletrodomésticos',   'electronica-reparacao-eletrodomesticos', true),
  ('Desenvolvimento web e aplicações',              'desenvolvimento-web-aplicacoes',     true),
  ('Design gráfico e branding',                     'design-grafico-branding',            true),
  ('Consultoria empresarial',                       'consultoria-empresarial',            true),
  ('Recursos humanos e recrutamento',               'recursos-humanos-recrutamento',      true),
  ('Cuidados com crianças',                         'cuidados-criancas',                  true),
  ('Cuidados com idosos',                           'cuidados-idosos',                    true),
  ('Saúde e enfermagem ao domicílio',               'saude-enfermagem-domicilio',         true),
  ('Organização de eventos e catering',             'organizacao-eventos-catering',       true);

-- ---------------------------------------------------------------------
-- 3. Desativar sem apagar, só se não tiverem serviços, vagas nem profissionais
-- ---------------------------------------------------------------------
UPDATE public.categorias c
   SET ativo = false
 WHERE c.nome IN ('Moto-taxi', 'Telemóveis e reparações')
   AND NOT EXISTS (SELECT 1 FROM public.servicos s WHERE s.categoria_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM public.profissionais p WHERE p.categoria_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM public.vagas v WHERE v.categoria = c.nome);

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) select count(*) from categorias  -> 20 - 0 + 12 = 32 linhas (30 oficiais + 2 desativadas)
--   b) select nome, ativo from categorias order by nome  -> 30 nomes oficiais ativos + Moto-taxi e Telemóveis e reparações (ativo = false, se sem uso)
--   c) select count(*) from servicos where categoria_id is null  -> 0 (igual a antes)
--   d) serviços 'Professor' e 'Serviço Teste B6.24' continuam ligados às mesmas categorias ids (ver relatório)
-- ---------------------------------------------------------------------
