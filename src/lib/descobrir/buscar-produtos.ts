import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { ParamsDescobrir } from './params';

export const RESULTADOS_POR_PAGINA = 12;

export type CategoriaDescobrir = { id: string; nome: string; slug: string };

export type ProdutoDescobrir = {
  id: string;
  slug: string;
  titulo: string;
  preco: number | null;
  preco_tipo: string;
  provincia: string;
  municipio: string | null;
  estado_produto: string;
  imagem: string | null;
};

export type ResultadoProdutos = {
  produtos: ProdutoDescobrir[];
  total: number;
};

type LinhaProduto = {
  id: string;
  slug: string;
  titulo: string;
  preco: number | null;
  preco_tipo: string;
  provincia: string;
  municipio: string | null;
  estado_produto: string;
  produto_imagens: { url: string; ordem: number }[] | null;
};

export async function obterCategoriasProdutos(): Promise<CategoriaDescobrir[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, slug')
    .eq('ativo', true)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar categorias (produtos). Código:', error.code);
    return [];
  }

  return (data ?? []) as CategoriaDescobrir[];
}

export async function obterMunicipiosProdutos(provincia: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('produtos')
    .select('municipio')
    .eq('estado_aprovacao', 'aprovado')
    .not('municipio', 'is', null);

  if (provincia) {
    query = query.eq('provincia', provincia);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar municípios (produtos). Código:', error.code);
    return [];
  }

  const municipios = (data ?? [])
    .map((linha) => linha.municipio as string | null)
    .filter((m): m is string => Boolean(m));

  return [...new Set(municipios)].sort();
}

export async function criarUrlImagemProduto(caminho: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from('produtos').createSignedUrl(caminho, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function buscarProdutosDescobrir(params: ParamsDescobrir): Promise<ResultadoProdutos> {
  const vazio: ResultadoProdutos = { produtos: [], total: 0 };
  const categorias = await obterCategoriasProdutos();

  const categoria = params.categoria
    ? categorias.find((c) => c.slug === params.categoria)
    : undefined;

  if (params.categoria && !categoria) {
    return vazio;
  }

  const supabase = await createSupabaseServerClient();
  const termo = params.q.replace(/[,()*"\\%_]/g, ' ').trim().slice(0, 100);

  let query = supabase
    .from('produtos')
    .select(
      'id, slug, titulo, preco, preco_tipo, provincia, municipio, estado_produto, produto_imagens(url, ordem)',
      { count: 'exact' },
    )
    .eq('estado_aprovacao', 'aprovado')
    .eq('companies.is_approved', true)
    .order('criado_em', { ascending: false });

  if (termo) {
    query = query.or(`titulo.ilike.*${termo}*,descricao.ilike.*${termo}*`);
  }

  if (categoria) {
    query = query.eq('categoria_id', categoria.id);
  }

  if (params.provincia) {
    query = query.eq('provincia', params.provincia);
  }

  if (params.municipio) {
    query = query.eq('municipio', params.municipio);
  }

  switch (params.preco) {
    case 'ate-50000':
      query = query.lte('preco', 50000);
      break;
    case '50000-200000':
      query = query.gte('preco', 50000).lte('preco', 200000);
      break;
    case 'acima-200000':
      query = query.gt('preco', 200000);
      break;
    case 'sob-consulta':
      query = query.eq('preco_tipo', 'sob_consulta');
      break;
  }

  if (params.estado_produto) {
    query = query.eq('estado_produto', params.estado_produto);
  }

  if (params.entrega) {
    query = query.eq('entrega', params.entrega);
  }

  const inicio = (params.pagina - 1) * RESULTADOS_POR_PAGINA;
  const { data, error, count } = await query.range(inicio, inicio + RESULTADOS_POR_PAGINA - 1);

  if (error) {
    console.error('Erro ao buscar produtos (descobrir). Código:', error.code);
    return vazio;
  }

  const linhas = (data ?? []) as LinhaProduto[];
  const produtos: ProdutoDescobrir[] = [];

  for (const linha of linhas) {
    const primeira = [...(linha.produto_imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0];
    const imagem = primeira ? await criarUrlImagemProduto(primeira.url) : null;

    produtos.push({
      id: linha.id,
      slug: linha.slug,
      titulo: linha.titulo,
      preco: linha.preco,
      preco_tipo: linha.preco_tipo,
      provincia: linha.provincia,
      municipio: linha.municipio,
      estado_produto: linha.estado_produto,
      imagem,
    });
  }

  return { produtos, total: count ?? 0 };
}
