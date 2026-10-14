'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth'

export type AlvoAvaliacao = {
  tipo: 'profissional' | 'empresa' | 'servico' | 'vaga'
  id: string
}

export type AvaliacaoInput = {
  alvo: AlvoAvaliacao
  nota: number
  comentario?: string
}

export type AvaliacaoUpdateInput = {
  avaliacaoId: string
  nota?: number
  comentario?: string
}

export type AvaliacaoWithUser = {
  id: string
  user_id: string
  profissional_id: string | null
  company_id: string | null
  servico_id: string | null
  vaga_id: string | null
  nota: number
  comentario: string | null
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
  }
}

export type MediaAvaliacoes = {
  media: number
  total: number
}

export type ActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

function validateAvaliacao(input: AvaliacaoInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.alvo || !input.alvo.tipo || !input.alvo.id) {
    errors.alvo = 'Alvo da avaliação é obrigatório'
  }

  if (!Number.isInteger(input.nota) || input.nota < 1 || input.nota > 5) {
    errors.nota = 'Nota deve ser um número inteiro entre 1 e 5'
  }

  if (input.comentario && input.comentario.length > 1000) {
    errors.comentario = 'Comentário deve ter no máximo 1000 caracteres'
  }

  return errors
}

function validateUpdate(input: AvaliacaoUpdateInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.avaliacaoId) {
    errors.avaliacaoId = 'ID da avaliação é obrigatório'
  }

  if (input.nota !== undefined && (!Number.isInteger(input.nota) || input.nota < 1 || input.nota > 5)) {
    errors.nota = 'Nota deve ser um número inteiro entre 1 e 5'
  }

  if (input.comentario !== undefined && input.comentario.length > 1000) {
    errors.comentario = 'Comentário deve ter no máximo 1000 caracteres'
  }

  return errors
}

async function verificarAlvoAprovado(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, alvo: AlvoAvaliacao): Promise<boolean> {
  switch (alvo.tipo) {
    case 'profissional': {
      const { data } = await supabase
        .from('profissionais')
        .select('estado')
        .eq('id', alvo.id)
        .single()
      return data?.estado === 'aprovado'
    }
    case 'empresa': {
      const { data } = await supabase
        .from('companies')
        .select('is_approved')
        .eq('id', alvo.id)
        .single()
      return data?.is_approved === true
    }
    case 'servico': {
      const { data } = await supabase
        .from('servicos')
        .select('estado')
        .eq('id', alvo.id)
        .single()
      return data?.estado === 'aprovado'
    }
    case 'vaga': {
      const { data } = await supabase
        .from('vagas')
        .select('estado')
        .eq('id', alvo.id)
        .single()
      return data?.estado === 'aprovado'
    }
    default:
      return false
  }
}

function getAlvoColumns(alvo: AlvoAvaliacao): Record<string, string | null> {
  const columns: Record<string, string | null> = {
    profissional_id: null,
    company_id: null,
    servico_id: null,
    vaga_id: null,
  }
  columns[`${alvo.tipo}_id`] = alvo.id
  return columns
}

export async function criarAvaliacao(input: AvaliacaoInput): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const fieldErrors = validateAvaliacao(input)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Dados inválidos', fieldErrors }
  }

  const alvoAprovado = await verificarAlvoAprovado(supabase, input.alvo)
  if (!alvoAprovado) {
    return { success: false, error: 'Não é possível avaliar este alvo. Apenas alvos aprovados podem ser avaliados.' }
  }

  const alvoColumns = getAlvoColumns(input.alvo)

  const { error } = await supabase
    .from('avaliacoes')
    .insert({
      user_id: user.id,
      ...alvoColumns,
      nota: input.nota,
      comentario: input.comentario?.trim() || null,
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe uma avaliação sua para este alvo' }
    }
    console.error('Erro ao criar avaliação:', error)
    return { success: false, error: 'Erro ao criar avaliação. Tente novamente.' }
  }

  const path = `/${input.alvo.tipo === 'empresa' ? 'empresa' : input.alvo.tipo}/${input.alvo.id}`
  revalidatePath(path)

  return { success: true }
}

export async function atualizarAvaliacao(input: AvaliacaoUpdateInput): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const fieldErrors = validateUpdate(input)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Dados inválidos', fieldErrors }
  }

  const { data: avaliacao, error: fetchError } = await supabase
    .from('avaliacoes')
    .select('user_id, profissional_id, company_id, servico_id, vaga_id')
    .eq('id', input.avaliacaoId)
    .single()

  if (fetchError || !avaliacao) {
    return { success: false, error: 'Avaliação não encontrada' }
  }

  if (avaliacao.user_id !== user.id) {
    return { success: false, error: 'Não tem permissão para alterar esta avaliação' }
  }

  const updates: Record<string, unknown> = {}
  if (input.nota !== undefined) updates.nota = input.nota
  if (input.comentario !== undefined) updates.comentario = input.comentario.trim() || null

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'Nenhum campo para actualizar' }
  }

  const { error } = await supabase
    .from('avaliacoes')
    .update(updates)
    .eq('id', input.avaliacaoId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao actualizar avaliação:', error)
    return { success: false, error: 'Erro ao actualizar avaliação. Tente novamente.' }
  }

  let revalidateTarget = '/'
  if (avaliacao.profissional_id) revalidateTarget = `/profissional/${avaliacao.profissional_id}`
  else if (avaliacao.company_id) revalidateTarget = `/empresa/${avaliacao.company_id}`
  else if (avaliacao.servico_id) revalidateTarget = `/servico/${avaliacao.servico_id}`
  else if (avaliacao.vaga_id) revalidateTarget = `/vaga/${avaliacao.vaga_id}`

  revalidatePath(revalidateTarget)

  return { success: true }
}

export async function removerAvaliacao(avaliacaoId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  if (!avaliacaoId) {
    return { success: false, error: 'ID da avaliação é obrigatório' }
  }

  const { data: avaliacao, error: fetchError } = await supabase
    .from('avaliacoes')
    .select('user_id, profissional_id, company_id, servico_id, vaga_id')
    .eq('id', avaliacaoId)
    .single()

  if (fetchError || !avaliacao) {
    return { success: false, error: 'Avaliação não encontrada' }
  }

  if (avaliacao.user_id !== user.id) {
    return { success: false, error: 'Não tem permissão para remover esta avaliação' }
  }

  const { error } = await supabase
    .from('avaliacoes')
    .delete()
    .eq('id', avaliacaoId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao remover avaliação:', error)
    return { success: false, error: 'Erro ao remover avaliação. Tente novamente.' }
  }

  let revalidateTarget = '/'
  if (avaliacao.profissional_id) revalidateTarget = `/profissional/${avaliacao.profissional_id}`
  else if (avaliacao.company_id) revalidateTarget = `/empresa/${avaliacao.company_id}`
  else if (avaliacao.servico_id) revalidateTarget = `/servico/${avaliacao.servico_id}`
  else if (avaliacao.vaga_id) revalidateTarget = `/vaga/${avaliacao.vaga_id}`

  revalidatePath(revalidateTarget)

  return { success: true }
}

export async function getAvaliacoesPorAlvo(alvo: AlvoAvaliacao): Promise<AvaliacaoWithUser[]> {
  const supabase = await createSupabaseServerClient()

  const column = `${alvo.tipo}_id`
  const { data, error } = await supabase
    .from('avaliacoes')
    .select(`
      id,
      user_id,
      profissional_id,
      company_id,
      servico_id,
      vaga_id,
      nota,
      comentario,
      created_at,
      updated_at
    `)
    .eq(column, alvo.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar avaliações:', error)
    return []
  }

  return data as AvaliacaoWithUser[]
}

export async function getMediaAvaliacoes(alvo: AlvoAvaliacao): Promise<MediaAvaliacoes> {
  const supabase = await createSupabaseServerClient()

  const column = `${alvo.tipo}_id`
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('nota')
    .eq(column, alvo.id)

  if (error) {
    console.error('Erro ao buscar média de avaliações:', error)
    return { media: 0, total: 0 }
  }

  if (!data || data.length === 0) {
    return { media: 0, total: 0 }
  }

  const total = data.length
  const soma = data.reduce((acc, a) => acc + a.nota, 0)
  const media = Math.round((soma / total) * 10) / 10

  return { media, total }
}

export async function getAvaliacaoDoUsuario(alvo: AlvoAvaliacao, userId: string): Promise<AvaliacaoWithUser | null> {
  const supabase = await createSupabaseServerClient()

  const column = `${alvo.tipo}_id`
  const { data, error } = await supabase
    .from('avaliacoes')
    .select(`
      id,
      user_id,
      profissional_id,
      company_id,
      servico_id,
      vaga_id,
      nota,
      comentario,
      created_at,
      updated_at
    `)
    .eq(column, alvo.id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as AvaliacaoWithUser
}