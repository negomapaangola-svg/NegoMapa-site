'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type VagaFormData = {
  titulo: string
  descricao: string
  requisitos: string
  categoria: string
  provincia: string
  municipio: string
  tipo_contrato: string
  salario: string
  whatsapp: string
}

export type ActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function validateWhatsApp(whatsapp: string): boolean {
  const clean = whatsapp.replace(/[\s+\-()]/g, '')
  const angolaPhoneRegex = /^(?:\+?244|0)?[92]\d{8}$/
  return angolaPhoneRegex.test(clean)
}

function validateVaga(data: VagaFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.titulo.trim()) errors.titulo = 'Título é obrigatório'
  if (!data.descricao.trim()) errors.descricao = 'Descrição é obrigatória'
  if (!data.categoria.trim()) errors.categoria = 'Categoria é obrigatória'
  if (!data.provincia.trim()) errors.provincia = 'Província é obrigatória'
  if (!data.whatsapp.trim()) errors.whatsapp = 'WhatsApp é obrigatório'
  if (data.whatsapp.trim() && !validateWhatsApp(data.whatsapp)) {
    errors.whatsapp = 'WhatsApp deve ser um número válido de Angola (ex: +244 9XX XXX XXX)'
  }
  return errors
}

export async function createVaga(formData: VagaFormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const fieldErrors = validateVaga(formData)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Dados inválidos', fieldErrors }
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, is_approved')
    .eq('user_id', user.id)
    .single()

  if (companyError || !company) {
    return { success: false, error: 'Empresa não encontrada. Cadastre a sua empresa primeiro.' }
  }

  if (!company.is_approved) {
    return { success: false, error: 'A sua empresa ainda não foi aprovada. Não é possível publicar vagas.' }
  }

  const baseSlug = generateSlug(formData.titulo)
  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data: existing } = await supabase
      .from('vagas')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const { error } = await supabase
    .from('vagas')
    .insert({
      company_id: company.id,
      titulo: formData.titulo.trim(),
      slug,
      descricao: formData.descricao.trim(),
      requisitos: formData.requisitos?.trim() || null,
      categoria: formData.categoria.trim(),
      provincia: formData.provincia.trim(),
      municipio: formData.municipio?.trim() || null,
      tipo_contrato: formData.tipo_contrato?.trim() || null,
      salario: formData.salario?.trim() || null,
      whatsapp: formData.whatsapp.trim(),
      estado: 'pendente',
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe uma vaga com este título. Tente outro.' }
    }
    if (error.code === '42501') {
      return { success: false, error: 'Sem permissão para criar vaga. Verifique a sua empresa.' }
    }
    console.error('Erro ao criar vaga:', error)
    return { success: false, error: 'Erro ao criar vaga. Tente novamente.' }
  }

  revalidatePath('/vagas')
  revalidatePath('/empresa/painel/vagas')
  redirect('/empresa/painel/vagas?cadastro=sucesso')
}

export async function getUserCompany() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, slug, sector, province, city, phone, email, is_approved, description')
    .eq('user_id', user.id)
    .single()

  return company
}

export type VagaListItem = {
  id: string
  titulo: string
  slug: string
  estado: string
  categoria: string
  provincia: string
  created_at: string
}

export async function getUserVagas(): Promise<VagaListItem[]> {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) return []

  const { data, error } = await supabase
    .from('vagas')
    .select('id, titulo, slug, estado, categoria, provincia, created_at')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar vagas:', error)
    return []
  }

  return data as VagaListItem[]
}

export type VagaAdminItem = {
  id: string
  titulo: string
  slug: string
  estado: string
  categoria: string
  provincia: string
  created_at: string
  company: {
    id: string
    name: string
  }[] | null
}

export async function getAllVagasAdmin(): Promise<VagaAdminItem[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('vagas')
    .select(`
      id,
      titulo,
      slug,
      estado,
      categoria,
      provincia,
      created_at,
      company:companies!company_id (id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar todas as vagas (admin):', error)
    return []
  }

  return data as VagaAdminItem[]
}

export async function aprovarVaga(vagaId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin')
  if (adminError || !isAdminData) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const { error } = await supabase
    .from('vagas')
    .update({ estado: 'aprovado' })
    .eq('id', vagaId)

  if (error) {
    console.error('Erro ao aprovar vaga:', error)
    return { success: false, error: 'Erro ao aprovar vaga. Tente novamente.' }
  }

  revalidatePath('/admin/vagas')
  revalidatePath('/vagas')
  return { success: true }
}

export async function rejeitarVaga(vagaId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin')
  if (adminError || !isAdminData) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const { error } = await supabase
    .from('vagas')
    .update({ estado: 'rejeitado' })
    .eq('id', vagaId)

  if (error) {
    console.error('Erro ao rejeitar vaga:', error)
    return { success: false, error: 'Erro ao rejeitar vaga. Tente novamente.' }
  }

  revalidatePath('/admin/vagas')
  revalidatePath('/vagas')
  return { success: true }
}