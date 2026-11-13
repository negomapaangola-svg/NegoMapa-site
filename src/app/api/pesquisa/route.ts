import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { obterLocalizacaoCliente } from '@/lib/actions/perfil-pessoal'
import { ordenarPorLocalizacaoAdministrativa } from '@/lib/localizacao/ordenar-resultados'

export const dynamic = 'force-dynamic'

const LIMITE_POR_GRUPO = 5
const LIMITE_CANDIDATOS = 50

function prepararTermo(valor: string): string {
  return valor.replace(/[,%()"'\\]/g, ' ').replace(/[%_]/g, ' ').replace(/\s+/g, ' ').trim()
}

function filtroComCategoria(campos: string[], padrao: string, categoriaIds: string[]): string {
  const filtros = campos.map((campo) => `${campo}.ilike.${padrao}`)
  if (categoriaIds.length) filtros.push(`categoria_id.in.(${categoriaIds.join(',')})`)
  return filtros.join(',')
}

export async function GET(request: Request) {
  const termo = prepararTermo(new URL(request.url).searchParams.get('q') ?? '')
  if (termo.length < 2) return NextResponse.json({ empresas: [], profissionais: [], servicos: [], vagas: [] })

  const [supabase, localizacao] = await Promise.all([createSupabaseServerClient(), obterLocalizacaoCliente()])
  const padrao = `%${termo}%`

  const { data: categorias, error: erroCategorias } = await supabase
    .from('categorias').select('id').ilike('nome', padrao)
  if (erroCategorias) {
    console.error('Erro na pesquisa de categorias. Código:', erroCategorias.code)
    return NextResponse.json({ error: 'Não foi possível concluir a pesquisa.' }, { status: 503 })
  }
  const categoriaIds = (categorias ?? []).map((categoria) => categoria.id)

  const [empresas, profissionais, servicos, vagas] = await Promise.all([
    supabase.from('empresas_publicas')
      .select('id,name,slug,sector,description,province,city,bairro')
      .eq('is_approved', true)
      .not('slug', 'is', null)
      .or(['name','sector','description','province','city'].map((campo) => `${campo}.ilike.${padrao}`).join(','))
      .order('name').limit(LIMITE_CANDIDATOS),
    supabase.from('profissionais_publicos')
      .select('id,nome,slug,bio,categoria_id,categoria,provincia,municipio')
      .not('slug', 'is', null)
      .or(filtroComCategoria(['nome','bio','provincia','municipio'], padrao, categoriaIds))
      .order('nome').limit(LIMITE_CANDIDATOS),
    supabase.from('servicos')
      .select('id,titulo,slug,descricao,categoria_id,provincia,municipio,categoria:categorias(nome)')
      .eq('estado', 'aprovado')
      .not('slug', 'is', null)
      .or(filtroComCategoria(['titulo','descricao','provincia','municipio'], padrao, categoriaIds))
      .order('titulo').limit(LIMITE_CANDIDATOS),
    supabase.from('vagas_publicas')
      .select('id,titulo,slug,categoria,descricao,provincia,municipio')
      .eq('estado', 'aprovado')
      .not('slug', 'is', null)
      .or(['titulo','categoria','descricao','provincia','municipio'].map((campo) => `${campo}.ilike.${padrao}`).join(','))
      .order('titulo').limit(LIMITE_CANDIDATOS),
  ])

  const erros = [empresas.error, profissionais.error, servicos.error, vagas.error]
  if (erros.some(Boolean)) {
    console.error('Erro numa ou mais consultas da pesquisa global. Códigos:', erros.map((erro) => erro?.code ?? null))
    return NextResponse.json({ error: 'Não foi possível concluir a pesquisa. Tente novamente.' }, { status: 503 })
  }

  const empresasOrdenadas = ordenarPorLocalizacaoAdministrativa(
    (empresas.data ?? []).map((empresa) => ({ ...empresa, municipio: empresa.city })),
    localizacao,
  ).slice(0, LIMITE_POR_GRUPO).map(({ city: _city, bairro: _bairro, ...empresa }) => empresa)
  const profissionaisOrdenados = ordenarPorLocalizacaoAdministrativa(
    (profissionais.data ?? []).map((profissional) => ({
      ...profissional,
      categoria: profissional.categoria ? { nome: profissional.categoria } : null,
    })),
    localizacao,
  ).slice(0, LIMITE_POR_GRUPO)
  const servicosOrdenados = ordenarPorLocalizacaoAdministrativa(servicos.data ?? [], localizacao).slice(0, LIMITE_POR_GRUPO)
  const vagasOrdenadas = ordenarPorLocalizacaoAdministrativa(vagas.data ?? [], localizacao).slice(0, LIMITE_POR_GRUPO)

  return NextResponse.json({
    empresas: empresasOrdenadas,
    profissionais: profissionaisOrdenados,
    servicos: servicosOrdenados,
    vagas: vagasOrdenadas,
  })
}
