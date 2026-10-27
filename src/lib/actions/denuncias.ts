'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getUser, isAdmin } from '@/lib/auth'

export type AlvoDenuncia = {
  tipo: 'profissional' | 'empresa' | 'servico' | 'vaga'
  id: string
}

export type DenunciaInput = {
  alvo: AlvoDenuncia
  motivo: 'conteudo_inadequado' | 'fraude' | 'informacao_falsa' | 'spam' | 'comportamento_abusivo' | 'outro'
  detalhes?: string
}

export type AtualizarEstadoInput = {
  denunciaId: string
  estado: 'analisada' | 'resolvida' | 'arquivada'
}

export type DenunciaWithDetails = {
  id: string
  user_id: string
  profissional_id: string | null
  company_id: string | null
  servico_id: string | null
  vaga_id: string | null
  motivo: string
  detalhes: string | null
  estado: string
  created_at: string
  resolvida_em: string | null
  resolvida_por: string | null
  user?: {
    id: string
    email: string
  }
  alvo?: {
    tipo: string
    id: string
    titulo?: string
    nome?: string
  }
}

export type FiltrosDenuncias = {
  estado?: 'pendente' | 'analisada' | 'resolvida' | 'arquivada'
  tipo_alvo?: 'profissional' | 'empresa' | 'servico' | 'vaga'
}

export type ActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

function validateDenuncia(input: DenunciaInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.alvo || !input.alvo.tipo || !input.alvo.id) {
    errors.alvo = 'Alvo da denúncia é obrigatório'
  }

  const motivosValidos = ['conteudo_inadequado', 'fraude', 'informacao_falsa', 'spam', 'comportamento_abusivo', 'outro']
  if (!input.motivo || !motivosValidos.includes(input.motivo)) {
    errors.motivo = 'Motivo inválido'
  }

  if (input.detalhes && input.detalhes.length > 1000) {
    errors.detalhes = 'Detalhes devem ter no máximo 1000 caracteres'
  }

  return errors
}

function validateEstado(input: AtualizarEstadoInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.denunciaId) {
    errors.denunciaId = 'ID da denúncia é obrigatório'
  }

  const estadosValidos = ['analisada', 'resolvida', 'arquivada']
  if (!input.estado || !estadosValidos.includes(input.estado)) {
    errors.estado = 'Estado inválido. Use: analisada, resolvida ou arquivada'
  }

  return errors
}

function getAlvoColumns(alvo: AlvoDenuncia): Record<string, string | null> {
  const columns: Record<string, string | null> = {
    profissional_id: null,
    company_id: null,
    servico_id: null,
    vaga_id: null,
  }
  columns[`${alvo.tipo}_id`] = alvo.id
  return columns
}

export async function criarDenuncia(input: DenunciaInput): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const fieldErrors = validateDenuncia(input)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Dados inválidos', fieldErrors }
  }

  const alvoColumns = getAlvoColumns(input.alvo)

  const { data: existingPending, error: checkError } = await supabase
    .from('denuncias')
    .select('id')
    .eq('user_id', user.id)
    .eq(`${input.alvo.tipo}_id`, input.alvo.id)
    .eq('estado', 'pendente')
    .maybeSingle()

  if (checkError) {
    console.error('Erro ao verificar denúncia existente:', checkError)
    return { success: false, error: 'Erro ao verificar denúncia existente. Tente novamente.' }
  }

  if (existingPending) {
    return { success: false, error: 'Já existe uma denúncia pendente sua para este alvo' }
  }

  const { error } = await supabase
    .from('denuncias')
    .insert({
      user_id: user.id,
      ...alvoColumns,
      motivo: input.motivo,
      detalhes: input.detalhes?.trim() || null,
      estado: 'pendente',
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe uma denúncia sua para este alvo' }
    }
    console.error('Erro ao criar denúncia:', error)
    return { success: false, error: 'Erro ao criar denúncia. Tente novamente.' }
  }

  const path = `/${input.alvo.tipo === 'empresa' ? 'empresa' : input.alvo.tipo}/${input.alvo.id}`
  revalidatePath(path)
  revalidatePath('/admin/denuncias')

  return { success: true }
}

export async function getMinhasDenuncias(): Promise<DenunciaWithDetails[]> {
  const supabase = await createSupabaseServerClient()

  const user = await getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('denuncias')
    .select(`
      id,
      user_id,
      profissional_id,
      company_id,
      servico_id,
      vaga_id,
      motivo,
      detalhes,
      estado,
      created_at,
      resolvida_em,
      resolvida_por
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar minhas denúncias:', error)
    return []
  }

  return (data as DenunciaWithDetails[]).map(d => ({
    ...d,
    alvo: d.profissional_id ? { tipo: 'profissional', id: d.profissional_id }
      : d.company_id ? { tipo: 'empresa', id: d.company_id }
      : d.servico_id ? { tipo: 'servico', id: d.servico_id }
      : d.vaga_id ? { tipo: 'vaga', id: d.vaga_id }
      : undefined,
  }))
}

export async function getDenunciasAdmin(filtros: FiltrosDenuncias = {}): Promise<DenunciaWithDetails[]> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return []
  }

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('denuncias')
    .select(`
      id,
      user_id,
      profissional_id,
      company_id,
      servico_id,
      vaga_id,
      motivo,
      detalhes,
      estado,
      created_at,
      resolvida_em,
      resolvida_por
    `)
    .order('created_at', { ascending: false })

  if (filtros.estado) {
    query = query.eq('estado', filtros.estado)
  }

  if (filtros.tipo_alvo) {
    query = query.not(`${filtros.tipo_alvo}_id`, 'is', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar denúncias (admin):', error)
    return []
  }

  return (data as unknown as DenunciaWithDetails[]).map(d => ({
    ...d,
    user: Array.isArray(d.user) ? (d.user[0] || null) : d.user,
    alvo: d.profissional_id ? { tipo: 'profissional', id: d.profissional_id }
      : d.company_id ? { tipo: 'empresa', id: d.company_id }
      : d.servico_id ? { tipo: 'servico', id: d.servico_id }
      : d.vaga_id ? { tipo: 'vaga', id: d.vaga_id }
      : undefined,
  }))
}

export async function atualizarEstadoDenuncia(input: AtualizarEstadoInput): Promise<ActionResult> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const supabase = await createSupabaseServerClient()

  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const fieldErrors = validateEstado(input)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Dados inválidos', fieldErrors }
  }

  const { data: denuncia, error: fetchError } = await supabase
    .from('denuncias')
    .select('id, estado, profissional_id, company_id, servico_id, vaga_id')
    .eq('id', input.denunciaId)
    .single()

  if (fetchError || !denuncia) {
    return { success: false, error: 'Denúncia não encontrada' }
  }

  const updates: Record<string, unknown> = {
    estado: input.estado,
  }

  updates.resolvida_em = new Date().toISOString()
  updates.resolvida_por = user.id

  const { error } = await supabase
    .from('denuncias')
    .update(updates)
    .eq('id', input.denunciaId)

  if (error) {
    console.error('Erro ao actualizar estado da denúncia:', error)
    return { success: false, error: 'Erro ao actualizar estado. Tente novamente.' }
  }

  revalidatePath('/admin/denuncias')

  let revalidateTarget = '/'
  if (denuncia.profissional_id) revalidateTarget = `/profissional/${denuncia.profissional_id}`
  else if (denuncia.company_id) revalidateTarget = `/empresa/${denuncia.company_id}`
  else if (denuncia.servico_id) revalidateTarget = `/servico/${denuncia.servico_id}`
  else if (denuncia.vaga_id) revalidateTarget = `/vaga/${denuncia.vaga_id}`

  revalidatePath(revalidateTarget)

  return { success: true }
}

export async function getDenunciaPendenteDoUsuario(alvo: AlvoDenuncia, userId: string): Promise<DenunciaWithDetails | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('denuncias')
    .select(`
      id,
      user_id,
      profissional_id,
      company_id,
      servico_id,
      vaga_id,
      motivo,
      detalhes,
      estado,
      created_at,
      resolvida_em,
      resolvida_por
    `)
    .eq('user_id', userId)
    .eq(`${alvo.tipo}_id`, alvo.id)
    .eq('estado', 'pendente')
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    alvo: { tipo: alvo.tipo, id: alvo.id },
  } as DenunciaWithDetails
}