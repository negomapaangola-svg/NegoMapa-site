-- Correcção C1.1: vistas de projecção pública com predicados equivalentes às políticas RLS públicas.
-- As tabelas base continuam com RLS e políticas intactas; anon só recebe SELECT nas vistas seguras.

CREATE OR REPLACE VIEW public.produtos_publicos
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  p.id,
  p.categoria_id,
  p.titulo,
  p.slug,
  p.descricao,
  p.preco,
  p.preco_tipo,
  p.estado_produto,
  p.entrega,
  p.provincia,
  p.municipio,
  p.criado_em
FROM public.produtos AS p
WHERE p.estado_aprovacao = 'aprovado'
  AND EXISTS (
    SELECT 1
    FROM public.companies AS c
    WHERE c.id = p.company_id
      AND c.is_approved = true
  );

CREATE OR REPLACE VIEW public.vagas_publicas
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  v.id,
  v.company_id,
  v.titulo,
  v.slug,
  v.descricao,
  v.requisitos,
  v.categoria,
  v.provincia,
  v.municipio,
  v.tipo_contrato,
  v.salario,
  v.estado,
  v.created_at
FROM public.vagas AS v
WHERE v.estado = 'aprovado'
  AND EXISTS (
    SELECT 1
    FROM public.companies AS c
    WHERE c.id = v.company_id
      AND c.is_approved = true
  );

CREATE OR REPLACE VIEW public.produto_imagens_publicas
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  pi.id,
  pi.produto_id,
  pi.url,
  pi.ordem
FROM public.produto_imagens AS pi
WHERE EXISTS (
  SELECT 1
  FROM public.produtos AS p
  JOIN public.companies AS c ON c.id = p.company_id
  WHERE p.id = pi.produto_id
    AND p.estado_aprovacao = 'aprovado'
    AND c.is_approved = true
);

-- Retira também os privilégios de coluna concedidos na migração inicial.
REVOKE ALL PRIVILEGES ON TABLE public.produtos FROM anon, PUBLIC;
REVOKE SELECT (
  id, company_id, categoria_id, titulo, slug, descricao, preco, preco_tipo,
  estado_produto, entrega, provincia, municipio, whatsapp, estado_aprovacao,
  motivo_rejeicao, avaliado_em, avaliado_por, criado_por, criado_em, actualizado_em
) ON TABLE public.produtos FROM anon, PUBLIC;

REVOKE ALL PRIVILEGES ON TABLE public.vagas FROM anon, PUBLIC;
REVOKE SELECT (
  id, company_id, titulo, slug, descricao, requisitos, categoria, provincia,
  municipio, tipo_contrato, salario, whatsapp, estado, created_at, updated_at,
  motivo_rejeicao, avaliado_em, avaliado_por
) ON TABLE public.vagas FROM anon, PUBLIC;

REVOKE ALL PRIVILEGES ON TABLE public.produto_imagens FROM anon, PUBLIC;
REVOKE SELECT (id, produto_id, url, ordem, criado_em)
  ON TABLE public.produto_imagens FROM anon, PUBLIC;

GRANT SELECT ON TABLE public.produtos_publicos TO anon, authenticated;
GRANT SELECT ON TABLE public.vagas_publicas TO anon, authenticated;
GRANT SELECT ON TABLE public.produto_imagens_publicas TO anon, authenticated;
