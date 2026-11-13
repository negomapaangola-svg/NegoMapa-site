import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Leitura pública de profissionais.
 *
 * Os visitantes leem SEMPRE a vista public.profissionais_publicos (só profissionais aprovados
 * e colunas seguras). Nunca se lê a tabela profissionais nem se usa embed PostgREST contra a
 * vista: quando é preciso o profissional de um serviço, faz-se uma segunda consulta à vista.
 * Os serviços do perfil leem a tabela servicos, sem whatsapp do serviço no perfil.
 */

export type PortfolioItem = {
  titulo: string
  descricao?: string | null
  url_projeto?: string | null
}

export type DisponibilidadeHorarios = {
  manha: boolean
  tarde: boolean
  noite: boolean
}

export type ProfissionalPublico = {
  id: string
  nome: string
  slug: string
  categoria_id: string | null
  categoria: string | null
  provincia: string | null
  municipio: string | null
  anos_experiencia: number | null
  bio: string | null
  distancia_km?: number | null
}

/** Dados do profissional necessários à página de serviço. Sem bairro, created_at nem telefone. */
export type ProfissionalContactoPublico = ProfissionalPublico & {
  whatsapp: string | null
  avatar_url: string | null
  portfolio: PortfolioItem[] | null
  disponibilidade_dias: string[] | null
  disponibilidade_horarios: DisponibilidadeHorarios | null
  especialidades: string[] | null
  experiencia_faixa: string | null
  faixa_preco_desde: string | null
}

export type ServicoPublico = {
  id: string
  slug: string
  titulo: string
  descricao: string | null
  preco: number | null
  preco_tipo: string | null
  provincia: string | null
  municipio: string | null
  created_at: string
  categoria: { id: string; nome: string; slug: string } | null
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const COLUNAS_BASE = 'id, nome, slug, categoria_id, categoria, provincia, municipio, anos_experiencia, bio'
const COLUNAS_CONTACTO = `${COLUNAS_BASE}, whatsapp, avatar_url, portfolio, disponibilidade_dias, disponibilidade_horarios, especialidades, experiencia_faixa, faixa_preco_desde`

export async function listarProfissionaisPublicos(): Promise<ProfissionalPublico[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profissionais_publicos')
    .select(COLUNAS_BASE)
    .order('nome')

  if (error) {
    console.error('Erro ao listar profissionais públicos. Código:', error.code)
    return []
  }

  return (data ?? []) as ProfissionalPublico[]
}

export async function obterProfissionalPublicoPorSlug(
  slug: string
): Promise<ProfissionalPublico | null> {
  if (!SLUG_REGEX.test(slug)) return null

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profissionais_publicos')
    .select(COLUNAS_BASE)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Erro ao obter profissional público. Código:', error.code)
    return null
  }

  return (data as ProfissionalPublico | null) ?? null
}

/** Ids dos profissionais aprovados visíveis ao público (para filtrar serviços sem embed). */
export async function obterIdsProfissionaisPublicos(): Promise<string[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profissionais_publicos')
    .select('id')

  if (error) {
    console.error('Erro ao obter ids de profissionais públicos. Código:', error.code)
    return []
  }

  return (data ?? []).map((linha) => linha.id as string)
}

/** Ids dos profissionais aprovados cujo nome contém o termo (pesquisa em /servicos). */
export async function obterIdsProfissionaisPublicosPorNome(termo: string): Promise<string[]> {
  const termoLimpo = termo.trim().slice(0, 100)
  if (!termoLimpo) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profissionais_publicos')
    .select('id')
    .ilike('nome', `%${termoLimpo}%`)

  if (error) {
    console.error('Erro ao pesquisar profissionais por nome. Código:', error.code)
    return []
  }

  return (data ?? []).map((linha) => linha.id as string)
}

/**
 * Dados de contacto de profissionais aprovados, por ids, pela vista.
 * Devolve um mapa id → profissional; ids não aprovados ficam de fora.
 */
export async function obterProfissionaisContactoPorIds(
  ids: string[]
): Promise<Map<string, ProfissionalContactoPublico>> {
  const idsValidos = [...new Set(ids)].filter((id) => UUID_REGEX.test(id))
  const mapa = new Map<string, ProfissionalContactoPublico>()
  if (idsValidos.length === 0) return mapa

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profissionais_publicos')
    .select(COLUNAS_CONTACTO)
    .in('id', idsValidos)

  if (error) {
    console.error('Erro ao obter contactos públicos de profissionais. Código:', error.code)
    return mapa
  }

  for (const linha of (data ?? []) as ProfissionalContactoPublico[]) {
    mapa.set(linha.id, linha)
  }
  return mapa
}

export async function obterProfissionalContactoPorId(
  id: string
): Promise<ProfissionalContactoPublico | null> {
  const mapa = await obterProfissionaisContactoPorIds([id])
  return mapa.get(id) ?? null
}

export async function listarServicosAprovadosDoProfissional(
  profissionalId: string
): Promise<ServicoPublico[]> {
  if (!UUID_REGEX.test(profissionalId)) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('servicos')
    .select(`
      id,
      slug,
      titulo,
      descricao,
      preco,
      preco_tipo,
      provincia,
      municipio,
      created_at,
      categoria:categoria_id (id, nome, slug)
    `)
    .eq('profissional_id', profissionalId)
    .eq('estado', 'aprovado')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao listar serviços do profissional. Código:', error.code)
    return []
  }

  return (data ?? []).map((item) => {
    const categoria = Array.isArray(item.categoria) ? item.categoria[0] : item.categoria
    return { ...item, categoria: categoria ?? null } as ServicoPublico
  })
}


export type ServicoRelacionadoPublico = {
  id: string;
  slug: string;
  titulo: string;
  preco: number | null;
  preco_tipo: string | null;
  provincia: string | null;
  municipio: string | null;
};

/** Serviços aprovados da mesma categoria, publicados por outros profissionais. */
export async function listarServicosRelacionadosDoProfissional(
  categoriaId: string | null,
  profissionalId: string
): Promise<ServicoRelacionadoPublico[]> {
  if (!categoriaId || !UUID_REGEX.test(categoriaId) || !UUID_REGEX.test(profissionalId)) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('servicos')
    .select('id, slug, titulo, preco, preco_tipo, provincia, municipio')
    .eq('categoria_id', categoriaId)
    .eq('estado', 'aprovado')
    .neq('profissional_id', profissionalId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Erro ao listar serviços relacionados. Código:', error.code);
    return [];
  }

  return (data ?? []) as ServicoRelacionadoPublico[];
}
