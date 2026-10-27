'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

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
  whatsapp?: string | null
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

  // Buscar IDs das empresas aprovadas
  const { data: approvedCompanies, error: companiesError } = await supabase
    .from('companies')
    .select('id')
    .eq('is_approved', true)

  if (companiesError) {
    console.error('Erro ao buscar empresas aprovadas:', companiesError)
    return { success: false, error: 'Erro ao carregar vagas' }
  }

  const approvedIds = (approvedCompanies ?? []).map((company) => company.id)

  if (approvedIds.length === 0) {
    return { success: true, data: [] }
  }

  const { data, error } = await supabase
    .from('vagas')
    .select(`
      id,
      titulo,
      slug,
      descricao,
      requisitos,
      categoria,
      provincia,
      municipio,
      tipo_contrato,
      salario,
      whatsapp,
      estado,
      created_at,
      company:companies!company_id (id, name, slug, provincia:province)
    `)
    .eq('estado', 'aprovado')
    .in('company_id', approvedIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar vagas públicas:', error)
    return { success: false, error: 'Erro ao carregar vagas' }
  }

  return { success: true, data: data as VagaPublic[] }
}