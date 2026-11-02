-- =====================================================================
-- REVERSÃO — categorias oficiais (migração 20261102140000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- Repõe os nomes anteriores das 15 categorias renomeadas, reativa Moto-taxi e
-- Telemóveis e reparações e remove as 12 categorias inseridas pela migração.
--
-- Pré-condições (a reversão aborta se não se verificarem, sem alterar nada):
--   - As 12 categorias inseridas não têm serviços, vagas nem profissionais associados.
--     (Se tiverem, a remoção não é segura: decidir antes o que fazer.)
--   - Os slugs não são alterados pela migração, por isso não há nada a repor nesse campo.
-- =====================================================================

BEGIN;

DO $pre$
DECLARE
  v_n integer;
BEGIN
  SELECT count(*)::integer INTO v_n
    FROM public.categorias c
   WHERE c.nome IN (
     'Serralheiro', 'Ar condicionado e refrigeração', 'Mudanças e transporte de mercadorias',
     'Electrónica e reparação de eletrodomésticos', 'Desenvolvimento web e aplicações',
     'Design gráfico e branding', 'Consultoria empresarial', 'Recursos humanos e recrutamento',
     'Cuidados com crianças', 'Cuidados com idosos', 'Saúde e enfermagem ao domicílio',
     'Organização de eventos e catering')
     AND (
       EXISTS (SELECT 1 FROM public.servicos s WHERE s.categoria_id = c.id)
       OR EXISTS (SELECT 1 FROM public.profissionais p WHERE p.categoria_id = c.id)
       OR EXISTS (SELECT 1 FROM public.vagas v WHERE v.categoria = c.nome)
     );
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Reversão cancelada: % categoria(s) inserida(s) têm uso. Decidir antes.', v_n;
  END IF;
END
$pre$;

-- 1. Repor os nomes anteriores
DO $repor$
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
     SET nome = m.antigo
    FROM mapa m
   WHERE c.nome = m.novo;

  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 15 THEN
    RAISE EXCEPTION 'Reversão esperava repor 15 nomes e alterou % — abortar', v_n;
  END IF;
END
$repor$;

-- 2. Reativar as duas categorias que a migração desativou
UPDATE public.categorias
   SET ativo = true
 WHERE nome IN ('Moto-taxi', 'Telemóveis e reparações');

-- 3. Remover as 12 categorias inseridas (já sem uso, verificado acima)
DELETE FROM public.categorias
 WHERE nome IN (
   'Serralheiro', 'Ar condicionado e refrigeração', 'Mudanças e transporte de mercadorias',
   'Electrónica e reparação de eletrodomésticos', 'Desenvolvimento web e aplicações',
   'Design gráfico e branding', 'Consultoria empresarial', 'Recursos humanos e recrutamento',
   'Cuidados com crianças', 'Cuidados com idosos', 'Saúde e enfermagem ao domicílio',
   'Organização de eventos e catering');

COMMIT;
