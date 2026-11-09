import { createSupabaseServerClient } from '@/lib/supabase-server';
import { obterIdsProfissionaisPublicos, obterIdsProfissionaisPublicosPorNome } from '@/lib/actions/profissionais-publicos';
import type { ParamsDescobrir } from './params';

export const RESULTADOS_POR_PAGINA = 12;

/**
 * Filtro de avaliação: a média calcula-se na aplicação (não há coluna de média na base).
 * Quando há filtro de avaliação, analisam-se no máximo estes candidatos.
 */
export const LIMITE_CANDIDATOS_AVALIACAO = 300;

export type CategoriaDescobrir = { id: string; nome: string; slug: string };

export type ServicoDescobrir = {
  id: string;
  slug: string;
  titulo: string;
  preco: number | null;
  preco_tipo: string | null;
  provincia: string | null;
  municipio: string | null;
  avaliacao: { media: number; total: number } | null;
};

export type ResultadoDescobrir = {
  servicos: ServicoDescobrir[];
  total: number;
  limitado: boolean;
};

type LinhaServico = {
  id: string;
  slug: string;
  titulo: string;
  preco: number | null;
  preco_tipo: string | null;
  provincia: string | null;
  municipio: string | null;
};

export async function obterCategoriasDescobrir(): Promise<CategoriaDescobrir[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, slug')
    .eq('ativo', true)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar categorias (descobrir). Código:', error.code);
    return [];
  }
  return (data ?? []) as CategoriaDescobrir[];
}

/** Municípios com serviços aprovados, na província escolhida (ou em todo o país). */
export async function obterMunicipiosDescobrir(provincia: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('servicos')
    .select('municipio')
    .eq('estado', 'aprovado')
    .not('municipio', 'is', null);

  if (provincia) {
    query = query.eq('provincia', provincia);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar municípios (descobrir). Código:', error.code);
    return [];
  }

  const municipios = (data ?? [])
    .map((linha) => linha.municipio as string | null)
    .filter((m): m is string => Boolean(m));
  return [...new Set(municipios)].sort();
}

/** Média e total de avaliações por serviço, para os ids indicados. */
async function obterAvaliacoesServicos(ids: string[]): Promise<Map<string, { media: number; total: number }>> {
  const mapa = new Map<string, { media: number; total: number }>();
  if (ids.length === 0) return mapa;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('servico_id, nota')
    .in('servico_id', ids);

  if (error) {
    console.error('Erro ao buscar avaliações (descobrir). Código:', error.code);
    return mapa;
  }

  const acumulado = new Map<string, { soma: number; total: number }>();
  for (const linha of (data ?? []) as { servico_id: string | null; nota: number }[]) {
    if (!linha.servico_id) continue;
    const atual = acumulado.get(linha.servico_id) ?? { soma: 0, total: 0 };
    atual.soma += Number(linha.nota);
    atual.total += 1;
    acumulado.set(linha.servico_id, atual);
  }

  acumulado.forEach(({ soma, total }, id) => {
    mapa.set(id, { media: Math.round((soma / total) * 10) / 10, total });
  });
  return mapa;
}

/** Serviços aprovados de profissionais públicos, com os filtros da URL. Só lê a tabela servicos. */
export async function buscarServicosDescobrir(params: ParamsDescobrir): Promise<ResultadoDescobrir> {
  const vazio: ResultadoDescobrir = { servicos: [], total: 0, limitado: false };

  const [idsProfissionais, categorias] = await Promise.all([
    obterIdsProfissionaisPublicos(),
    obterCategoriasDescobrir(),
  ]);
  if (idsProfissionais.length === 0 || categorias.length === 0) {
    return vazio;
  }

  const categoria = params.categoria ? categorias.find((c) => c.slug === params.categoria) : undefined;
  if (params.categoria && !categoria) {
    return vazio;
  }

  const supabase = await createSupabaseServerClient();

  // Texto de pesquisa sem caracteres que quebram a sintaxe do filtro .or().
  const termo = params.q.replace(/[,()*"\\%_]/g, ' ').trim().slice(0, 100);

  let query = supabase
    .from('servicos')
    .select('id, slug, titulo, preco, preco_tipo, provincia, municipio', { count: 'exact' })
    .eq('estado', 'aprovado')
    .in('profissional_id', idsProfissionais)
    .in('categoria_id', categorias.map((c) => c.id))
    .order('created_at', { ascending: false });

  if (termo) {
    // Título do serviço OU nome do profissional aprovado.
    const idsPorNome = await obterIdsProfissionaisPublicosPorNome(termo);
    const condicoes = [`titulo.ilike.*${termo}*`];
    if (idsPorNome.length > 0) {
      condicoes.push(`profissional_id.in.(${idsPorNome.join(',')})`);
    }
    query = query.or(condicoes.join(','));
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
      query = query.is('preco', null);
      break;
  }

  const comAvaliacao = params.avaliacao !== '';
  const inicio = (params.pagina - 1) * RESULTADOS_POR_PAGINA;

  const consulta = comAvaliacao
    ? query.limit(LIMITE_CANDIDATOS_AVALIACAO)
    : query.range(inicio, inicio + RESULTADOS_POR_PAGINA - 1);

  const { data, error, count } = await consulta;
  if (error) {
    console.error('Erro ao buscar serviços (descobrir). Código:', error.code);
    return vazio;
  }

  let linhas = (data ?? []) as LinhaServico[];
  let total = count ?? 0;
  const limitado = comAvaliacao && linhas.length >= LIMITE_CANDIDATOS_AVALIACAO;

  const medias = await obterAvaliacoesServicos(linhas.map((l) => l.id));

  if (comAvaliacao) {
    const minimo = Number(params.avaliacao);
    linhas = linhas.filter((l) => {
      const media = medias.get(l.id);
      return Boolean(media) && (media?.media ?? 0) >= minimo;
    });
    total = linhas.length;
    linhas = linhas.slice(inicio, inicio + RESULTADOS_POR_PAGINA);
  }

  const servicos: ServicoDescobrir[] = linhas.map((l) => ({
    id: l.id,
    slug: l.slug,
    titulo: l.titulo,
    preco: l.preco,
    preco_tipo: l.preco_tipo,
    provincia: l.provincia,
    municipio: l.municipio,
    avaliacao: medias.get(l.id) ?? null,
  }));

  return { servicos, total, limitado };
}
