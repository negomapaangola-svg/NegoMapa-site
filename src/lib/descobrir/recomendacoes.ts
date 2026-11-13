import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { obterIdsProfissionaisPublicos } from '@/lib/actions/profissionais-publicos';
import { obterDistanciasAproximadas } from '@/lib/actions/proximidade';
import type { LocalizacaoAdministrativa } from '@/lib/localizacao/ordenar-resultados';

export type RecomendacaoDescobrir = {
  id: string;
  tipo: 'servico' | 'produto';
  slug: string;
  titulo: string;
  preco: number | null;
  preco_tipo: string | null;
  provincia: string | null;
  municipio: string | null;
  categoria: string | null;
  avaliacao: { media: number; total: number } | null;
  distancia_km: number | null;
};

type Candidato = RecomendacaoDescobrir & {
  categoria_id: string;
  publicado_em: string;
};

const LIMITE_CANDIDATOS = 100;
const LIMITE_RECOMENDACOES = 6;

function normalizar(valor: string | null | undefined): string {
  return (valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt');
}

function compararRecomendacoes(
  a: Candidato,
  b: Candidato,
  preferencias: Set<string>,
  localizacao: LocalizacaoAdministrativa,
): number {
  const categoriaA = preferencias.size && preferencias.has(a.categoria_id) ? 0 : 1;
  const categoriaB = preferencias.size && preferencias.has(b.categoria_id) ? 0 : 1;
  if (categoriaA !== categoriaB) return categoriaA - categoriaB;

  const municipio = normalizar(localizacao?.municipio);
  const provincia = normalizar(localizacao?.provincia);
  const municipioA = municipio && normalizar(a.municipio) === municipio ? 0 : 1;
  const municipioB = municipio && normalizar(b.municipio) === municipio ? 0 : 1;
  if (municipioA !== municipioB) return municipioA - municipioB;

  const provinciaA = provincia && normalizar(a.provincia) === provincia ? 0 : 1;
  const provinciaB = provincia && normalizar(b.provincia) === provincia ? 0 : 1;
  if (provinciaA !== provinciaB) return provinciaA - provinciaB;

  const distanciaA = a.distancia_km;
  const distanciaB = b.distancia_km;
  if (distanciaA !== null && distanciaB === null) return -1;
  if (distanciaA === null && distanciaB !== null) return 1;
  if (distanciaA !== null && distanciaB !== null && distanciaA !== distanciaB) return distanciaA - distanciaB;

  const avaliacaoA = a.avaliacao?.media ?? 0;
  const avaliacaoB = b.avaliacao?.media ?? 0;
  if (avaliacaoA !== avaliacaoB) return avaliacaoB - avaliacaoA;

  return new Date(b.publicado_em).getTime() - new Date(a.publicado_em).getTime();
}

/**
 * Recomenda apenas serviços e produtos públicos. Preferências e localização do cliente
 * são lidas no servidor e nunca fazem parte do resultado devolvido à interface.
 */
export async function obterRecomendacoesDescobrir(
  localizacaoSeleccionada: { provincia?: string; municipio?: string } = {},
): Promise<RecomendacaoDescobrir[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let idsPreferidos: string[] = [];
    let localizacao: LocalizacaoAdministrativa = null;
    let clienteAutenticado = false;

    if (user) {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('account_type,localizacao_provincia,localizacao_municipio,localizacao_bairro')
        .eq('id', user.id)
        .maybeSingle();

      clienteAutenticado = perfil?.account_type === 'cliente';
      if (clienteAutenticado) {
        localizacao = {
          provincia: perfil?.localizacao_provincia ?? null,
          municipio: perfil?.localizacao_municipio ?? null,
          bairro: perfil?.localizacao_bairro ?? null,
        };
        const { data: preferencias } = await supabase
          .from('preferencias_cliente')
          .select('categoria_id')
          .eq('user_id', user.id);
        idsPreferidos = (preferencias ?? []).map((item) => item.categoria_id);
      }
    }

    // Sem preferências, os filtros de localização seleccionados servem de contexto.
    // Na ausência desses filtros, usa-se a localização administrativa guardada pelo cliente.
    if (idsPreferidos.length === 0) {
      localizacao = {
        provincia: localizacaoSeleccionada.provincia || localizacao?.provincia || null,
        municipio: localizacaoSeleccionada.municipio || localizacao?.municipio || null,
        bairro: localizacao?.bairro ?? null,
      };
    }

    const [idsProfissionais, categorias] = await Promise.all([
      obterIdsProfissionaisPublicos(),
      supabase.from('categorias').select('id,nome').eq('ativo', true),
    ]);
    const nomesCategorias = new Map((categorias.data ?? []).map((item) => [item.id, item.nome]));

    const consultaServicos = idsProfissionais.length
      ? supabase.from('servicos')
          .select('id,slug,titulo,preco,preco_tipo,provincia,municipio,categoria_id,profissional_id,created_at')
          .eq('estado', 'aprovado')
          .in('profissional_id', idsProfissionais)
          .order('created_at', { ascending: false })
          .limit(LIMITE_CANDIDATOS)
      : Promise.resolve({ data: [], error: null });

    const [servicosResult, produtosResult] = await Promise.all([
      consultaServicos,
      supabase.from('produtos_publicos')
        .select('id,slug,titulo,preco,preco_tipo,provincia,municipio,categoria_id,criado_em')
        .order('criado_em', { ascending: false })
        .limit(LIMITE_CANDIDATOS),
    ]);

    const servicos = servicosResult.error ? [] : (servicosResult.data ?? []);
    const produtos = produtosResult.error ? [] : (produtosResult.data ?? []);
    const idsServicos = servicos.map((item) => item.id);

    const [avaliacoesResult, distanciasServicos, distanciasProdutos] = await Promise.all([
      idsServicos.length
        ? supabase.from('avaliacoes').select('servico_id,nota').in('servico_id', idsServicos)
        : Promise.resolve({ data: [], error: null }),
      clienteAutenticado ? obterDistanciasAproximadas('servico', idsServicos) : Promise.resolve({} as Record<string, number>),
      clienteAutenticado ? obterDistanciasAproximadas('produto', produtos.map((item) => item.id)) : Promise.resolve({} as Record<string, number>),
    ]);

    const acumulado = new Map<string, { soma: number; total: number }>();
    for (const avaliacao of avaliacoesResult.data ?? []) {
      if (!avaliacao.servico_id || typeof avaliacao.nota !== 'number') continue;
      const actual = acumulado.get(avaliacao.servico_id) ?? { soma: 0, total: 0 };
      actual.soma += avaliacao.nota;
      actual.total += 1;
      acumulado.set(avaliacao.servico_id, actual);
    }

    const candidatos: Candidato[] = [
      ...servicos.map((item): Candidato => {
        const resumo = acumulado.get(item.id);
        return {
          id: item.id, tipo: 'servico', slug: item.slug, titulo: item.titulo,
          preco: item.preco, preco_tipo: item.preco_tipo, provincia: item.provincia,
          municipio: item.municipio, categoria_id: item.categoria_id,
          categoria: nomesCategorias.get(item.categoria_id) ?? null,
          avaliacao: resumo ? { media: Math.round((resumo.soma / resumo.total) * 10) / 10, total: resumo.total } : null,
          distancia_km: distanciasServicos[item.id] ?? null,
          publicado_em: item.created_at,
        };
      }),
      ...produtos.map((item): Candidato => ({
        id: item.id, tipo: 'produto', slug: item.slug, titulo: item.titulo,
        preco: item.preco, preco_tipo: item.preco_tipo, provincia: item.provincia,
        municipio: item.municipio, categoria_id: item.categoria_id,
        categoria: nomesCategorias.get(item.categoria_id) ?? null,
        avaliacao: null,
        distancia_km: distanciasProdutos[item.id] ?? null,
        publicado_em: item.criado_em,
      })),
    ];

    const preferencias = new Set(idsPreferidos);
    return candidatos
      .sort((a, b) => compararRecomendacoes(a, b, preferencias, localizacao))
      .slice(0, LIMITE_RECOMENDACOES)
      .map(({ categoria_id: _categoriaId, publicado_em: _publicadoEm, ...item }) => item);
  } catch (error) {
    console.error('Erro ao preparar recomendações de Descobrir:', error);
    return [];
  }
}
