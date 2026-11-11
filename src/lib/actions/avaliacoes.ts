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

const UUID_ALVO_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIPOS_ALVO = ['profissional', 'empresa', 'servico', 'vaga'] as const

function alvoValido(alvo: AlvoAvaliacao): boolean {
  return Boolean(alvo && TIPOS_ALVO.includes(alvo.tipo) && UUID_ALVO_RE.test(alvo.id))
}

export type ActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

function validateAvaliacao(input: AvaliacaoInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!alvoValido(input.alvo)) {
    errors.alvo = 'Alvo da avaliação inválido'
  }

  if (!Number.isInteger(input.nota) || input.nota < 1 || input.nota > 5) {
    errors.nota = 'Nota deve ser um número inteiro entre 1 e 5'
  }

  if (input.comentario !== undefined && (typeof input.comentario !== 'string' || input.comentario.trim().length > 1000)) {
    errors.comentario = 'Comentário deve ter no máximo 1000 caracteres'
  }

  return errors
}

function validateUpdate(input: AvaliacaoUpdateInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!UUID_ALVO_RE.test(input.avaliacaoId)) {
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
      const { data, error } = await supabase
        .from('profissionais_publicos')
        .select('id')
        .eq('id', alvo.id)
        .maybeSingle()
      return !error && Boolean(data)
    }
    case 'empresa': {
      const { data, error } = await supabase
        .from('empresas_publicas')
        .select('id')
        .eq('id', alvo.id)
        .maybeSingle()
      return !error && Boolean(data)
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
  const coluna = alvo.tipo === 'empresa' ? 'company_id' : `${alvo.tipo}_id`
  columns[coluna] = alvo.id
  return columns
}

export async function criarAvaliacao(input: AvaliacaoInput): Promise<ActionResult> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Dados da avaliação inválidos.' }
  }

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

  const colunaAlvo = input.alvo.tipo === 'empresa' ? 'company_id' : `${input.alvo.tipo}_id`
  const { data: existente, error: erroExistente } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('user_id', user.id)
    .eq(colunaAlvo, input.alvo.id)
    .maybeSingle()

  if (erroExistente) {
    console.error('Erro ao verificar avaliação existente. Código:', erroExistente.code)
    return { success: false, error: 'Não foi possível verificar se já existe uma avaliação.' }
  }
  if (existente) {
    return { success: false, error: 'Já existe uma avaliação sua para este alvo.' }
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
    console.error('Erro ao criar avaliação. Código:', error.code)
    return { success: false, error: 'Não foi possível enviar a avaliação. Tente novamente.' }
  }

  if (input.alvo.tipo === 'profissional') {
    revalidatePath('/profissional/[slug]', 'page')
  } else {
    revalidatePath(`/${input.alvo.tipo}/${input.alvo.id}`)
  }

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

  if (!UUID_ALVO_RE.test(avaliacaoId)) {
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
  if (!alvoValido(alvo)) return []
  const supabase = await createSupabaseServerClient()

  const column = alvo.tipo === 'empresa' ? 'company_id' : `${alvo.tipo}_id`
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
  if (!alvoValido(alvo)) return { media: 0, total: 0 }
  const supabase = await createSupabaseServerClient()

  const column = alvo.tipo === 'empresa' ? 'company_id' : `${alvo.tipo}_id`
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
  const user = await getUser()
  const tiposValidos = ['profissional', 'empresa', 'servico', 'vaga']
  if (!user || user.id !== userId || !alvo || !tiposValidos.includes(alvo.tipo) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alvo.id)) return null

  const supabase = await createSupabaseServerClient()

  const column = alvo.tipo === 'empresa' ? 'company_id' : `${alvo.tipo}_id`
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

export type AvaliacaoPublicaProfissional = {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
};

/**
 * Leitura pública mínima: não selecciona user_id, email ou identificadores de outros alvos.
 * A RLS da tabela limita as avaliações públicas a profissionais aprovados.
 */
export async function getAvaliacoesPublicasPorProfissional(
  profissionalId: string
): Promise<AvaliacaoPublicaProfissional[]> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profissionalId)) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('id, nota, comentario, created_at')
    .eq('profissional_id', profissionalId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Erro ao buscar avaliações públicas do profissional:', error.code);
    return [];
  }

  return (data ?? []) as AvaliacaoPublicaProfissional[];
}
