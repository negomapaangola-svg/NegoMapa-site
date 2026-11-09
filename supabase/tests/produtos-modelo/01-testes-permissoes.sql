\set ON_ERROR_STOP 1
-- Dados de teste (superutilizador, ignora RLS)
INSERT INTO auth.users (id) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001'),('aaaaaaaa-0000-0000-0000-000000000002'),
 ('aaaaaaaa-0000-0000-0000-000000000003'),('aaaaaaaa-0000-0000-0000-000000000009');
INSERT INTO public.admin_users (user_id) VALUES ('aaaaaaaa-0000-0000-0000-000000000009');
INSERT INTO public.companies (id, user_id, name, is_approved) VALUES
 ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Empresa 1 (aprovada)',true),
 ('cccccccc-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','Empresa 2 (aprovada)',true),
 ('cccccccc-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000003','Empresa 3 (NÃO aprovada)',false);
INSERT INTO public.categorias (id, nome, slug) VALUES ('bbbbbbbb-0000-0000-0000-000000000001','Eletrónica','eletronica');

CREATE OR REPLACE FUNCTION pg_temp.como(papel text, uid uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', coalesce(uid::text, ''), false);
  EXECUTE format('SET ROLE %I', papel);
END $$;

CREATE OR REPLACE FUNCTION pg_temp.ok(label text, stmt text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE stmt;
  RAISE NOTICE 'PASSA: %', label;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'FALHA (devia funcionar): % -> %', label, SQLERRM;
END $$;

-- Passa se der erro OU se não afetar nenhuma linha (RLS filtra em silêncio).
CREATE OR REPLACE FUNCTION pg_temp.bloqueia(label text, stmt text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE stmt;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE NOTICE 'PASSA (0 linhas): %', label;
  ELSE
    RAISE EXCEPTION 'FALHA (devia bloquear, afetou % linhas): %', n, label;
  END IF;
EXCEPTION WHEN others THEN
  IF SQLERRM LIKE 'FALHA%' THEN RAISE; END IF;
  RAISE NOTICE 'PASSA (bloqueado): % -> %', label, SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.afirma(label text, consulta text, esperado bigint) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE consulta INTO n;
  IF n = esperado THEN
    RAISE NOTICE 'PASSA: % (= %)', label, n;
  ELSE
    RAISE EXCEPTION 'FALHA: % (obtido %, esperado %)', label, n, esperado;
  END IF;
END $$;

-- ---------------------------------------------------------------- Empresa 1 cria produtos
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000001');
SELECT pg_temp.ok('Empresa 1 cria produto P1 (pede estado aprovado)',
 $$INSERT INTO public.produtos (id, company_id, categoria_id, titulo, slug, preco, preco_tipo, estado_produto, entrega, provincia, estado_aprovacao)
   VALUES ('eeeeeeee-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','Televisor 43 polegadas','televisor-43',150000,'fixo','usado','paga','Luanda','aprovado')$$);
SELECT pg_temp.ok('Empresa 1 cria produto P2 sob consulta sem preço',
 $$INSERT INTO public.produtos (id, company_id, categoria_id, titulo, slug, preco, preco_tipo, estado_produto, entrega, provincia)
   VALUES ('eeeeeeee-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','Gerador a combinar','gerador-combinar',NULL,'sob_consulta','novo','a_combinar','Benguela')$$);
SELECT pg_temp.bloqueia('Preço nulo com preco_tipo fixo é recusado',
 $$INSERT INTO public.produtos (company_id, categoria_id, titulo, slug, preco, preco_tipo, estado_produto, entrega, provincia)
   VALUES ('cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','Sem preço','sem-preco',NULL,'fixo','novo','gratuita','Luanda')$$);
SELECT pg_temp.bloqueia('Empresa 1 não pode criar produto para a Empresa 2',
 $$INSERT INTO public.produtos (company_id, categoria_id, titulo, slug, preco, preco_tipo, estado_produto, entrega, provincia)
   VALUES ('cccccccc-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000001','Intruso','intruso',10,'fixo','novo','gratuita','Luanda')$$);
SELECT pg_temp.bloqueia('Empresa 1 não pode mudar a empresa do P1',
 $$UPDATE public.produtos SET company_id='cccccccc-0000-0000-0000-000000000002' WHERE id='eeeeeeee-0000-0000-0000-000000000001'$$);
SELECT pg_temp.bloqueia('Empresa 1 não pode aprovar o P1 por UPDATE',
 $$UPDATE public.produtos SET estado_aprovacao='aprovado' WHERE id='eeeeeeee-0000-0000-0000-000000000002'$$);
SELECT pg_temp.ok('Empresa 1 edita o próprio produto P2',
 $$UPDATE public.produtos SET descricao='Gerador 5 kVA, usado' WHERE id='eeeeeeee-0000-0000-0000-000000000002'$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000002');
SELECT pg_temp.bloqueia('Empresa 2 não vê nem altera o P1 da Empresa 1',
 $$UPDATE public.produtos SET titulo='Hackeado' WHERE id='eeeeeeee-0000-0000-0000-000000000001'$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------- Imagens (limite 1 a 6)
SELECT pg_temp.ok('Empresa 1 adiciona 6 imagens a P1 (ordem 0 é a principal)',
 $$INSERT INTO public.produto_imagens (produto_id, url, ordem)
   SELECT 'eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000001/imagem-' || g || '.webp', g
   FROM generate_series(0,5) g$$);
SELECT pg_temp.bloqueia('Sétima imagem em P1 é recusada (máximo 6)',
 $$INSERT INTO public.produto_imagens (produto_id, url, ordem) VALUES ('eeeeeeee-0000-0000-0000-000000000001','x/y/extra.webp',6)$$);
SELECT pg_temp.ok('Empresa 1 adiciona 1 imagem a P2 (pendente, sem imagens até agora)',
 $$INSERT INTO public.produto_imagens (produto_id, url, ordem) VALUES ('eeeeeeee-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000002/imagem-0.webp',0)$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000002');
SELECT pg_temp.bloqueia('Empresa 2 não pode adicionar imagem a produto da Empresa 1',
 $$INSERT INTO public.produto_imagens (produto_id, url, ordem) VALUES ('eeeeeeee-0000-0000-0000-000000000001','x/intruso.webp',9)$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000001');
-- Storage: objetos correspondentes (o Storage API cria estes registos no upload)
SELECT pg_temp.ok('Empresa 1 carrega os ficheiros de P1 e P2 na sua pasta',
 $$INSERT INTO storage.objects (bucket_id, name)
   SELECT 'produtos', 'cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000001/imagem-' || g || '.webp' FROM generate_series(0,5) g
   UNION ALL SELECT 'produtos', 'cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000002/imagem-0.webp'$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000002');
SELECT pg_temp.bloqueia('Empresa 2 não carrega ficheiros na pasta da Empresa 1',
 $$INSERT INTO storage.objects (bucket_id, name) VALUES ('produtos','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-000000000001/intruso.webp')$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------- Público antes da aprovação
SELECT pg_temp.como('anon', NULL);
SELECT pg_temp.afirma('Anónimo não vê produtos pendentes', 'SELECT count(*) FROM public.produtos', 0);
SELECT pg_temp.afirma('Anónimo não vê imagens de produtos pendentes', 'SELECT count(*) FROM public.produto_imagens', 0);
SELECT pg_temp.afirma('Anónimo não vê ficheiros de produtos pendentes', 'SELECT count(*) FROM storage.objects WHERE bucket_id=''produtos''', 0);
SELECT pg_temp.bloqueia('Anónimo não cria produto', $$INSERT INTO public.produtos (company_id, categoria_id, titulo, slug, preco, preco_tipo, estado_produto, entrega, provincia) VALUES ('cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','Anon','anon-prod',1,'fixo','novo','gratuita','Luanda')$$);
SELECT pg_temp.bloqueia('Anónimo não altera produto', $$UPDATE public.produtos SET titulo='x' WHERE id='eeeeeeee-0000-0000-0000-000000000001'$$);
SELECT pg_temp.bloqueia('Anónimo não apaga produto', $$DELETE FROM public.produtos WHERE id='eeeeeeee-0000-0000-0000-000000000001'$$);
SELECT pg_temp.bloqueia('Anónimo não apaga imagens', $$DELETE FROM public.produto_imagens WHERE produto_id='eeeeeeee-0000-0000-0000-000000000001'$$);
SELECT pg_temp.bloqueia('Anónimo não chama a aprovação', $$SELECT public.admin_avaliar_produto('eeeeeeee-0000-0000-0000-000000000001','aprovado',NULL)$$);

-- ---------------------------------------------------------------- Aprovação pelo administrador
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000001');
SELECT pg_temp.bloqueia('Empresa 1 não aprova a própria oferta', $$SELECT public.admin_avaliar_produto('eeeeeeee-0000-0000-0000-000000000001','aprovado',NULL)$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000009');
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000001');
SELECT pg_temp.ok('Empresa 1 cria P5 sem imagens', $$INSERT INTO public.produtos (id, company_id, categoria_id, titulo, slug, preco, preco_tipo, estado_produto, entrega, provincia) VALUES ('eeeeeeee-0000-0000-0000-000000000005','cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','Produto sem fotografias','prod-sem-foto',2000,'fixo','novo','gratuita','Luanda')$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000009');
SELECT pg_temp.bloqueia('Aprovar P5 sem imagens é recusado', $$SELECT public.admin_avaliar_produto('eeeeeeee-0000-0000-0000-000000000005','aprovado',NULL)$$);
SELECT pg_temp.bloqueia('Rejeição com motivo curto é recusada', $$SELECT public.admin_avaliar_produto('eeeeeeee-0000-0000-0000-000000000002','rejeitado','curto')$$);
SELECT pg_temp.ok('Admin aprova P1 (tem 6 imagens)', $$SELECT public.admin_avaliar_produto('eeeeeeee-0000-0000-0000-000000000001','aprovado',NULL)$$);
SELECT pg_temp.ok('Admin rejeita P2 com motivo válido', $$SELECT public.admin_avaliar_produto('eeeeeeee-0000-0000-0000-000000000002','rejeitado','Fotografia não corresponde ao produto.')$$);

-- Empresa 3 (não aprovada) cria produto com imagem e é aprovado pelo admin
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000003');
SELECT pg_temp.ok('Empresa 3 cria P4', $$INSERT INTO public.produtos (id, company_id, categoria_id, titulo, slug, preco, preco_tipo, estado_produto, entrega, provincia) VALUES ('eeeeeeee-0000-0000-0000-000000000004','cccccccc-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000001','Produto empresa não aprovada','prod-emp3',5000,'fixo','novo','gratuita','Huíla')$$);
SELECT pg_temp.ok('Empresa 3 adiciona imagem a P4', $$INSERT INTO public.produto_imagens (produto_id, url, ordem) VALUES ('eeeeeeee-0000-0000-0000-000000000004','cccccccc-0000-0000-0000-000000000003/eeeeeeee-0000-0000-0000-000000000004/imagem-0.webp',0)$$);
SELECT pg_temp.ok('Empresa 3 carrega o ficheiro de P4', $$INSERT INTO storage.objects (bucket_id, name) VALUES ('produtos','cccccccc-0000-0000-0000-000000000003/eeeeeeee-0000-0000-0000-000000000004/imagem-0.webp')$$);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000009');
SELECT pg_temp.ok('Admin aprova P4 (empresa ainda não aprovada)', $$SELECT public.admin_avaliar_produto('eeeeeeee-0000-0000-0000-000000000004','aprovado',NULL)$$);

-- Verificações do público (anónimo)
SELECT pg_temp.como('anon', NULL);
SELECT pg_temp.afirma('Anónimo vê só P1 (aprovado de empresa aprovada)', 'SELECT count(*) FROM public.produtos', 1);
SELECT pg_temp.afirma('Anónimo vê P1 com as 6 imagens', 'SELECT count(*) FROM public.produto_imagens', 6);
SELECT pg_temp.afirma('Anónimo vê apenas o ficheiro de P1 (6)', 'SELECT count(*) FROM storage.objects WHERE bucket_id=''produtos''', 6);
SELECT pg_temp.afirma('Anónimo não vê P2 (rejeitado)', 'SELECT count(*) FROM public.produtos WHERE id=''eeeeeeee-0000-0000-0000-000000000002''', 0);
SELECT pg_temp.afirma('Anónimo não vê P4 (empresa não aprovada)', 'SELECT count(*) FROM public.produtos WHERE id=''eeeeeeee-0000-0000-0000-000000000004''', 0);
SELECT pg_temp.afirma('Anónimo não vê ficheiros de P4', 'SELECT count(*) FROM storage.objects WHERE name LIKE ''cccccccc-0000-0000-0000-000000000003%''', 0);

-- Proprietárias
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000001');
SELECT pg_temp.afirma('Empresa 1 vê P1, P2 e P5 (incluindo rejeitado e pendente)', 'SELECT count(*) FROM public.produtos WHERE company_id=''cccccccc-0000-0000-0000-000000000001''', 3);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000002');
SELECT pg_temp.afirma('Empresa 2 não vê P2 rejeitado da Empresa 1', 'SELECT count(*) FROM public.produtos WHERE id=''eeeeeeee-0000-0000-0000-000000000002''', 0);
SELECT pg_temp.afirma('Empresa 2 vê P1 (público, aprovado)', 'SELECT count(*) FROM public.produtos WHERE id=''eeeeeeee-0000-0000-0000-000000000001''', 1);
SELECT pg_temp.afirma('Empresa 2 não vê as imagens de P2 (rejeitado)', 'SELECT count(*) FROM public.produto_imagens WHERE produto_id=''eeeeeeee-0000-0000-0000-000000000002''', 0);
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000001');

-- Limite inferior: não apagar a última imagem de produto aprovado
SELECT pg_temp.ok('Empresa 1 apaga as imagens 1 a 5 de P1 (fica a principal)', $$DELETE FROM public.produto_imagens WHERE produto_id='eeeeeeee-0000-0000-0000-000000000001' AND ordem BETWEEN 1 AND 5$$);
SELECT pg_temp.afirma('P1 fica com 1 imagem', 'SELECT count(*) FROM public.produto_imagens WHERE produto_id=''eeeeeeee-0000-0000-0000-000000000001''', 1);
SELECT pg_temp.bloqueia('Não é possível apagar a última imagem de produto aprovado', $$DELETE FROM public.produto_imagens WHERE produto_id='eeeeeeee-0000-0000-0000-000000000001' AND ordem=0$$);
SELECT pg_temp.ok('Empresa 1 edita o estado do produto (estado_produto) de P1', $$UPDATE public.produtos SET estado_produto='novo' WHERE id='eeeeeeee-0000-0000-0000-000000000001'$$);
SELECT pg_temp.bloqueia('Empresa 1 não altera o motivo de rejeição', $$UPDATE public.produtos SET motivo_rejeicao='texto livre' WHERE id='eeeeeeee-0000-0000-0000-000000000002'$$);
SELECT pg_temp.bloqueia('Empresa 1 não chama a aprovação', $$SELECT public.admin_avaliar_produto('eeeeeeee-0000-0000-0000-000000000002','aprovado',NULL)$$);
SELECT pg_temp.bloqueia('Empresa 1 não remove ficheiros de outro produto', $$DELETE FROM storage.objects WHERE name LIKE 'cccccccc-0000-0000-0000-000000000003%'$$);

-- Admin vê tudo e pode gerir
SELECT pg_temp.como('authenticated','aaaaaaaa-0000-0000-0000-000000000009');
SELECT pg_temp.afirma('Admin vê todos os produtos (P1, P2, P4, P5)', 'SELECT count(*) FROM public.produtos', 4);
SELECT pg_temp.ok('Admin pode apagar P2 (rejeitado)', $$DELETE FROM public.produtos WHERE id='eeeeeeee-0000-0000-0000-000000000002'$$);

-- Restrições de dados sem perfil de utilizador
SELECT pg_temp.bloqueia('Motivo de rejeição obrigatório na escrita direta do admin', $$UPDATE public.produtos SET estado_aprovacao='rejeitado', motivo_rejeicao=NULL WHERE id='eeeeeeee-0000-0000-0000-000000000004'$$);
SELECT pg_temp.bloqueia('Estado de aprovação inválido é recusado', $$UPDATE public.produtos SET estado_aprovacao='talvez' WHERE id='eeeeeeee-0000-0000-0000-000000000004'$$);

RESET ROLE;
-- Verificação da configuração (catálogo)
SELECT pg_temp.afirma('Bucket produtos é privado, com limite de 5 MB e só imagens', $$SELECT count(*) FROM storage.buckets WHERE id='produtos' AND public=false AND file_size_limit=5242880 AND allowed_mime_types @> ARRAY['image/webp','image/jpeg','image/png'] AND cardinality(allowed_mime_types)=3$$, 1);
