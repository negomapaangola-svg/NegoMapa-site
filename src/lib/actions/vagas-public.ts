'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

// Sem whatsapp, motivo_rejeicao, avaliado_por nem avaliado_em.
// O contacto de candidatura é obtido só por obter_contacto_candidatura().
export type VagaPublic = {
  id: string
  titulo: string
  slug: string
  descricao: string
  requisitos?: string | null
  categoria: string
  provincia: string
  municipio?: string | null
  tipo_contrato?: string | null
  salario?: string | null
  estado: string
  created_at: string
  company: {
    id: string
    name: string
    slug: string
    provincia?: string | null
  }[]
}

export type VagasPublicasResult =
  | { success: true; data: VagaPublic[] }
  | { success: false; error: string }

export async function getVagasPublicas(): Promise<VagasPublicasResult> {
  const supabase = await createSupabaseServerClient()

  // Empresas aprovadas. Filtro explícito: a vista herda a RLS do chamador,
  // e para o dono a RLS também devolve a própria empresa não aprovada.
  const { data: empresas, error: empresasError } = await supabase
    .from('empresas_publicas')
    .select('id, name, slug, province')
    .eq('is_approved', true)

  if (empresasError) {
    console.error('Erro ao buscar empresas aprovadas:', empresasError)
    return { success: false, error: 'Erro ao carregar vagas' }
  }

  const empresasPorId = new Map((empresas ?? []).map((e) => [e.id, e]))

  if (empresasPorId.size === 0) {
    return { success: true, data: [] }
  }

  // Sem embed company:companies!company_id: relações não se inferem sobre vistas.
  // A junção é feita aqui, com a lista de empresas já filtrada.
  const { data: vagas, error: vagasError } = await supabase
    .from('vagas_publicas')
    .select(`
      id,
      company_id,
      titulo,
      slug,
      descricao,
      requisitos,
      categoria,
      provincia,
      municipio,
      tipo_contrato,
      salario,
      estado,
      created_at
    `)
    .eq('estado', 'aprovado')
    .in('company_id', Array.from(empresasPorId.keys()))
    .order('created_at', { ascending: false })

  if (vagasError) {
    console.error('Erro ao carregar vagas públicas:', vagasError)
    return { success: false, error: 'Erro ao carregar vagas' }
  }

  const data: VagaPublic[] = (vagas ?? []).map((vaga) => {
    const { company_id, ...resto } = vaga
    const empresa = empresasPorId.get(company_id)
    return {
      ...resto,
      company: empresa
        ? [{ id: empresa.id, name: empresa.name, slug: empresa.slug, provincia: empresa.province }]
        : [],
    }
  })

  return { success: true, data }
}
