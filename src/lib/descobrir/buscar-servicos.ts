import { createSupabaseServerClient } from '@/lib/supabase-server';
import {
  obterIdsProfissionaisPublicos,
  obterIdsProfissionaisPublicosPorNome,
} from '@/lib/actions/profissionais-publicos';
import type { ParamsDescobrir } from './params';
import { ordenarPorDistanciaEAdministrativa, type LocalizacaoAdministrativa } from '@/lib/localizacao/ordenar-resultados';
import { obterDistanciasAproximadas } from '@/lib/actions/proximidade';

export const RESULTADOS_POR_PAGINA = 12;
const LIMITE_AVALIACAO = 300;

export type CategoriaDescobrir = { id: string; nome: string; slug: string };
export type AvaliacaoResumo = { media: number; total: number };

export type ServicoDescobrir = {
  id: string;
  slug: string;
  titulo: string;
  preco: number | null;
  preco_tipo: string | null;
  provincia: string | null;
  municipio: string | null;
  avaliacao: AvaliacaoResumo | null;
  distancia_km?: number | null;
};

export type ResultadoDescobrir = {
  servicos: ServicoDescobrir[];
  total: number;
  limitado?: boolean;
};

type LinhaServico = Omit<ServicoDescobrir, 'avaliacao'> & { profissional_id: string };
type LinhaAvaliacao = { servico_id: string; nota: number };

function validarAvaliacoes(data: unknown): LinhaAvaliacao[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (linha): linha is LinhaAvaliacao =>
      typeof linha?.servico_id === 'string' && typeof linha?.nota === 'number',
  );
}

function resumirAvaliacoes(linhas: LinhaAvaliacao[]): Map<string, AvaliacaoResumo> {
  const acumulado = new Map<string, { soma: number; total: number }>();
  for (const linha of linhas) {
    const actual = acumulado.get(linha.servico_id) ?? { soma: 0, total: 0 };
    actual.soma += linha.nota;
    actual.total += 1;
    acumulado.set(linha.servico_id, actual);
  }
  const resumos = new Map<string, AvaliacaoResumo>();
  for (const [id, valor] of acumulado) {
    resumos.set(id, {
      media: Math.round((valor.soma / valor.total) * 10) / 10,
      total: valor.total,
    });
  }
  return resumos;
}

export async function obterCategoriasDescobrir(): Promise<CategoriaDescobrir[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, slug')
    .eq('ativo', true)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar categorias de serviços. Código:', error.code);
    return [];
  }
  return (data ?? []) as CategoriaDescobrir[];
}

export async function obterMunicipiosDescobrir(provincia: string): Promise<string[]> {
  const idsProfissionais = await obterIdsProfissionaisPublicos();
  if (idsProfissionais.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('servicos')
    .select('municipio')
    .eq('estado', 'aprovado')
    .in('profissional_id', idsProfissionais)
    .not('municipio', 'is', null);

  if (provincia) query = query.eq('provincia', provincia);

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar municípios de serviços. Código:', error.code);
    return [];
  }

  return [...new Set((data ?? []).map((linha) => linha.municipio).filter((m): m is string => Boolean(m)))].sort();
}

export async function buscarServicosDescobrir(params: ParamsDescobrir, localizacao: LocalizacaoAdministrativa = null): Promise<ResultadoDescobrir> {
  const vazio: ResultadoDescobrir = { servicos: [], total: 0 };
  const [idsProfissionais, categorias] = await Promise.all([
    obterIdsProfissionaisPublicos(),
    obterCategoriasDescobrir(),
  ]);
  if (idsProfissionais.length === 0 || categorias.length === 0) return vazio;

  const categoria = params.categoria ? categorias.find((item) => item.slug === params.categoria) : undefined;
  if (params.categoria && !categoria) return vazio;

  const supabase = await createSupabaseServerClient();
  const termo = params.q.replace(/[,()*"\\%_]/g, ' ').trim().slice(0, 100);
  let query = supabase
    .from('servicos')
    .select('id, slug, titulo, preco, preco_tipo, provincia, municipio, profissional_id', { count: 'exact' })
    .eq('estado', 'aprovado')
    .in('profissional_id', idsProfissionais)
    .in('categoria_id', categorias.map((item) => item.id))
    .order('created_at', { ascending: false });

  if (termo) {
    const idsPorNome = await obterIdsProfissionaisPublicosPorNome(termo);
    const condicoes = [`titulo.ilike.*${termo}*`];
    if (idsPorNome.length > 0) condicoes.push(`profissional_id.in.(${idsPorNome.join(',')})`);
    query = query.or(condicoes.join(','));
  }
  if (categoria) query = query.eq('categoria_id', categoria.id);
  if (params.provincia) query = query.eq('provincia', params.provincia);
  if (params.municipio) query = query.eq('municipio', params.municipio);

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

  const comFiltroAvaliacao = Boolean(params.avaliacao);
  const inicio = (params.pagina - 1) * RESULTADOS_POR_PAGINA;
  const { data, error, count } = await query.limit(comFiltroAvaliacao ? LIMITE_AVALIACAO : 1000);

  if (error) {
    console.error('Erro ao buscar serviços para Descobrir. Código:', error.code);
    return vazio;
  }

  const linhas = (data ?? []) as LinhaServico[];
  if (linhas.length === 0) return { ...vazio, limitado: comFiltroAvaliacao };

  const { data: avaliacoes, error: erroAvaliacoes } = await supabase
    .from('avaliacoes')
    .select('servico_id, nota')
    .in('servico_id', linhas.map((linha) => linha.id));

  if (erroAvaliacoes) {
    console.error('Erro ao calcular avaliações dos serviços. Código:', erroAvaliacoes.code);
  }
  const resumos = resumirAvaliacoes(validarAvaliacoes(avaliacoes));

  const distancias = await obterDistanciasAproximadas('servico', linhas.map((linha) => linha.id));
  let resultados: ServicoDescobrir[] = linhas.map((linha) => ({
    id: linha.id,
    slug: linha.slug,
    titulo: linha.titulo,
    preco: linha.preco,
    preco_tipo: linha.preco_tipo,
    provincia: linha.provincia,
    municipio: linha.municipio,
    avaliacao: resumos.get(linha.id) ?? null,
    distancia_km: distancias[linha.id] ?? null,
  }));

  if (comFiltroAvaliacao) {
    const minimo = Number(params.avaliacao);
    resultados = resultados.filter((item) => (item.avaliacao?.media ?? 0) >= minimo);
    const totalFiltrado = resultados.length;
    const ordenados = ordenarPorDistanciaEAdministrativa(resultados, localizacao);
    return {
      servicos: ordenados.slice(inicio, inicio + RESULTADOS_POR_PAGINA),
      total: totalFiltrado,
      limitado: (count ?? 0) > LIMITE_AVALIACAO,
    };
  }

  const ordenados = ordenarPorLocalizacaoAdministrativa(resultados, localizacao);
  return { servicos: ordenados.slice(inicio, inicio + RESULTADOS_POR_PAGINA), total: count ?? 0 };
}
