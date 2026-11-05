import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const LIMITE_POR_GRUPO = 5

export async function GET(request: Request) {
  const termo = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (termo.length < 2) {
    return NextResponse.json({ empresas: [], profissionais: [], servicos: [], vagas: [] })
  }

  const supabase = await createSupabaseServerClient()
  const padrao = `%${termo}%`

  const [empresas, profissionais, servicos, vagas] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, slug, sector, province, city')
      .eq('is_approved', true)
      .or(`name.ilike.${padrao},sector.ilike.${padrao},province.ilike.${padrao},city.ilike.${padrao},description.ilike.${padrao}`)
      .order('name')
      .limit(LIMITE_POR_GRUPO),
    supabase
      .from('profissionais')
      .select('id, nome, profissao, provincia, municipio')
      .or(`nome.ilike.${padrao},profissao.ilike.${padrao},provincia.ilike.${padrao},municipio.ilike.${padrao},descricao.ilike.${padrao}`)
      .order('nome')
      .limit(LIMITE_POR_GRUPO),
    supabase
      .from('servicos')
      .select('id, titulo, categoria, provincia, municipio')
      .or(`titulo.ilike.${padrao},categoria.ilike.${padrao},provincia.ilike.${padrao},municipio.ilike.${padrao},descricao.ilike.${padrao}`)
      .order('titulo')
      .limit(LIMITE_POR_GRUPO),
    supabase
      .from('vagas')
      .select('id, titulo, categoria, provincia, municipio')
      .eq('is_approved', true)
      .or(`titulo.ilike.${padrao},categoria.ilike.${padrao},provincia.ilike.${padrao},municipio.ilike.${padrao},descricao.ilike.${padrao}`)
      .order('titulo')
      .limit(LIMITE_POR_GRUPO),
  ])

  return NextResponse.json({
    empresas: empresas.data ?? [],
    profissionais: profissionais.data ?? [],
    servicos: servicos.data ?? [],
    vagas: vagas.data ?? [],
  })
}
