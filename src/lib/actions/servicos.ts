'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ProfileFormData = {
  nome: string
  telefone: string
  whatsapp: string
  bio: string
  provincia: string
  municipio: string
}

export type ServiceFormData = {
  titulo: string
  categoria_id: string
  descricao: string
  preco: string
  preco_tipo: string
  whatsapp: string
  provincia: string
  municipio: string
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

function validateProfile(data: ProfileFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.nome.trim()) errors.nome = 'Nome é obrigatório'
  if (!data.telefone.trim()) errors.telefone = 'Telefone é obrigatório'
  if (!data.whatsapp.trim()) errors.whatsapp = 'WhatsApp é obrigatório'
  if (!data.provincia.trim()) errors.provincia = 'Província é obrigatória'
  if (!data.municipio.trim()) errors.municipio = 'Município é obrigatório'
  return errors
}

function validateService(data: ServiceFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.titulo.trim()) errors.titulo = 'Título é obrigatório'
  if (!data.categoria_id) errors.categoria_id = 'Categoria é obrigatória'
  if (!data.descricao.trim()) errors.descricao = 'Descrição é obrigatória'
  if (!data.preco_tipo) errors.preco_tipo = 'Tipo de preço é obrigatório'
  if (!data.whatsapp.trim()) errors.whatsapp = 'WhatsApp é obrigatório'
  if (!data.provincia.trim()) errors.provincia = 'Província é obrigatória'
  if (!data.municipio.trim()) errors.municipio = 'Município é obrigatória'
  if (data.preco && isNaN(Number(data.preco))) errors.preco = 'Preço deve ser um número válido'
  return errors
}

export async function createProfile(formData: ProfileFormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const fieldErrors = validateProfile(formData)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Dados inválidos', fieldErrors }
  }

  const slug = generateSlug(formData.nome)
  const uniqueSlug = `${slug}-${user.id.slice(0, 8)}`

  const { error } = await supabase
    .from('profissionais')
    .insert({
      user_id: user.id,
      nome: formData.nome.trim(),
      slug: uniqueSlug,
      telefone: formData.telefone.trim(),
      whatsapp: formData.whatsapp.trim(),
      bio: formData.bio.trim(),
      provincia: formData.provincia.trim(),
      municipio: formData.municipio.trim(),
      estado: 'pendente',
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um perfil para este utilizador' }
    }
    console.error('Erro ao criar perfil:', error)
    return { success: false, error: 'Erro ao criar perfil. Tente novamente.' }
  }

  revalidatePath('/cadastrar-servico')
  return { success: true }
}

export async function createService(formData: ServiceFormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const fieldErrors = validateService(formData)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Dados inválidos', fieldErrors }
  }

  const { data: profissional, error: profError } = await supabase
    .from('profissionais')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profError || !profissional) {
    return { success: false, error: 'Perfil profissional não encontrado. Crie o perfil primeiro.' }
  }

  const baseSlug = generateSlug(formData.titulo)
  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data: existing } = await supabase
      .from('servicos')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const preco = formData.preco ? Number(formData.preco) : null

  const { error } = await supabase
    .from('servicos')
    .insert({
      profissional_id: profissional.id,
      categoria_id: formData.categoria_id,
      titulo: formData.titulo.trim(),
      slug,
      descricao: formData.descricao.trim(),
      preco,
      preco_tipo: formData.preco_tipo,
      whatsapp: formData.whatsapp.trim(),
      provincia: formData.provincia.trim(),
      municipio: formData.municipio.trim(),
      estado: 'pendente',
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um serviço com este título. Tente outro.' }
    }
    if (error.code === '42501') {
      return { success: false, error: 'Sem permissão para criar serviço. Verifique o seu perfil.' }
    }
    console.error('Erro ao criar serviço:', error)
    return { success: false, error: 'Erro ao criar serviço. Tente novamente.' }
  }

  revalidatePath('/servicos')
  revalidatePath('/cadastrar-servico')
  redirect('/servicos?cadastro=sucesso')
}

export async function getUserProfile() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('profissionais')
    .select('id, nome, telefone, whatsapp, bio, provincia, municipio, estado, slug')
    .eq('user_id', user.id)
    .single()

  return perfil
}

export async function getActiveCategories() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, slug')
    .eq('ativo', true)
    .order('nome')

  if (error) {
    console.error('Erro ao buscar categorias:', error)
    return []
  }

  return data || []
}

async function verifyAdmin(): Promise<ActionResult | null> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email || !session.user.email.includes('@admin')) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  return null
}

export async function approveService(serviceId: string): Promise<ActionResult> {
  const authError = await verifyAdmin()
  if (authError) return authError

  if (!serviceId || typeof serviceId !== 'string') {
    return { success: false, error: 'ID do serviço inválido' }
  }

  const supabase = await createSupabaseServerClient()

  const { data: existingService, error: fetchError } = await supabase
    .from('servicos')
    .select('id')
    .eq('id', serviceId)
    .single()

  if (fetchError || !existingService) {
    return { success: false, error: 'Serviço não encontrado' }
  }

  const { error } = await supabase
    .from('servicos')
    .update({ estado: 'aprovado' })
    .eq('id', serviceId)

  if (error) {
    console.error('Erro ao aprovar serviço:', error)
    return { success: false, error: 'Erro ao aprovar serviço. Tente novamente.' }
  }

  revalidatePath('/admin/servicos')
  return { success: true }
}

export async function rejectService(serviceId: string): Promise<ActionResult> {
  const authError = await verifyAdmin()
  if (authError) return authError

  if (!serviceId || typeof serviceId !== 'string') {
    return { success: false, error: 'ID do serviço inválido' }
  }

  const supabase = await createSupabaseServerClient()

  const { data: existingService, error: fetchError } = await supabase
    .from('servicos')
    .select('id')
    .eq('id', serviceId)
    .single()

  if (fetchError || !existingService) {
    return { success: false, error: 'Serviço não encontrado' }
  }

  const { error } = await supabase
    .from('servicos')
    .update({ estado: 'rejeitado' })
    .eq('id', serviceId)

  if (error) {
    console.error('Erro ao rejeitar serviço:', error)
    return { success: false, error: 'Erro ao rejeitar serviço. Tente novamente.' }
  }

  revalidatePath('/admin/servicos')
  return { success: true }
}

export async function suspendService(serviceId: string): Promise<ActionResult> {
  const authError = await verifyAdmin()
  if (authError) return authError

  if (!serviceId || typeof serviceId !== 'string') {
    return { success: false, error: 'ID do serviço inválido' }
  }

  const supabase = await createSupabaseServerClient()

  const { data: existingService, error: fetchError } = await supabase
    .from('servicos')
    .select('id')
    .eq('id', serviceId)
    .single()

  if (fetchError || !existingService) {
    return { success: false, error: 'Serviço não encontrado' }
  }

  const { error } = await supabase
    .from('servicos')
    .update({ estado: 'suspenso' })
    .eq('id', serviceId)

  if (error) {
    console.error('Erro ao suspender serviço:', error)
    return { success: false, error: 'Erro ao suspender serviço. Tente novamente.' }
  }

  revalidatePath('/admin/servicos')
  return { success: true }
}

export async function reactivateService(serviceId: string): Promise<ActionResult> {
  const authError = await verifyAdmin()
  if (authError) return authError

  if (!serviceId || typeof serviceId !== 'string') {
    return { success: false, error: 'ID do serviço inválido' }
  }

  const supabase = await createSupabaseServerClient()

  const { data: existingService, error: fetchError } = await supabase
    .from('servicos')
    .select('id')
    .eq('id', serviceId)
    .single()

  if (fetchError || !existingService) {
    return { success: false, error: 'Serviço não encontrado' }
  }

  const { error } = await supabase
    .from('servicos')
    .update({ estado: 'aprovado' })
    .eq('id', serviceId)

  if (error) {
    console.error('Erro ao reativar serviço:', error)
    return { success: false, error: 'Erro ao reativar serviço. Tente novamente.' }
  }

  revalidatePath('/admin/servicos')
  return { success: true }
}