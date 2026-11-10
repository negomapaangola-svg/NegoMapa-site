'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/** Função que o utilizador desempenha numa conversa. Um utilizador pode ter várias. */
export type PapelConversa = 'cliente' | 'profissional' | 'empresa'

export type ConversaResumo = {
  id: string
  cliente_id: string
  profissional_id: string | null
  empresa_id: string | null
  criada_em: string
  /** Papel do utilizador autenticado nesta conversa; define o rótulo do interlocutor. */
  papel: PapelConversa
}

export type MensagemConversa = {
  id: string
  remetente_id: string
  conteudo: string
  lida_em: string | null
  criada_em: string
}

type Resultado<T> = { success: true; data: T } | { success: false; error: string }

export async function listarConversas(): Promise<Resultado<ConversaResumo[]>> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  // A RLS devolve apenas as conversas em que o utilizador participa.
  const { data, error } = await supabase
    .from('conversas')
    .select('id, cliente_id, profissional_id, empresa_id, criada_em')
    .order('criada_em', { ascending: false })

  if (error) {
    console.error('Erro ao listar conversas. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar as conversas.' }
  }

  // Perfis e empresas do próprio utilizador (a RLS devolve só os seus registos).
  const [{ data: perfil }, { data: empresas }] = await Promise.all([
    supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('companies').select('id').eq('user_id', user.id),
  ])
  const idsProfissional = new Set(perfil?.id ? [perfil.id] : [])
  const idsEmpresa = new Set((empresas ?? []).map((e) => e.id))

  const conversas: ConversaResumo[] = (data ?? []).map((conversa) => {
    let papel: PapelConversa = 'cliente'
    if (conversa.cliente_id === user.id) {
      papel = 'cliente'
    } else if (conversa.profissional_id && idsProfissional.has(conversa.profissional_id)) {
      papel = 'profissional'
    } else if (conversa.empresa_id && idsEmpresa.has(conversa.empresa_id)) {
      papel = 'empresa'
    }
    return { ...(conversa as Omit<ConversaResumo, 'papel'>), papel }
  })

  return { success: true, data: conversas }
}

async function utilizadorParticipaNaConversa(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  conversaId: string,
  userId: string
): Promise<boolean> {
  if (!UUID_REGEX.test(conversaId)) return false

  const { data: conversa, error } = await supabase
    .from('conversas')
    .select('id, cliente_id, profissional_id, empresa_id')
    .eq('id', conversaId)
    .maybeSingle()

  if (error || !conversa) return false
  if (conversa.cliente_id === userId) return true

  const [{ data: perfil }, { data: empresas }] = await Promise.all([
    supabase.from('profissionais').select('id').eq('user_id', userId).maybeSingle(),
    supabase.from('companies').select('id').eq('user_id', userId),
  ])

  if (conversa.profissional_id && perfil?.id === conversa.profissional_id) return true
  return Boolean(conversa.empresa_id && (empresas ?? []).some((empresa) => empresa.id === conversa.empresa_id))
}

export async function listarMensagens(conversaId: string): Promise<Resultado<MensagemConversa[]>> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  if (!UUID_REGEX.test(conversaId) || !(await utilizadorParticipaNaConversa(supabase, conversaId, user.id))) {
    return { success: false, error: 'Conversa não encontrada ou sem permissão.' }
  }

  const { data, error } = await supabase
    .from('mensagens')
    .select('id, remetente_id, conteudo, lida_em, criada_em')
    .eq('conversa_id', conversaId)
    .order('criada_em', { ascending: true })

  if (error) {
    console.error('Erro ao listar mensagens. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar as mensagens.' }
  }

  return { success: true, data: (data ?? []) as MensagemConversa[] }
}

export async function enviarMensagem(conversaId: string, conteudo: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  if (typeof conteudo !== 'string' || !UUID_REGEX.test(conversaId) || !(await utilizadorParticipaNaConversa(supabase, conversaId, user.id))) {
    return { success: false, error: 'Conversa não encontrada ou sem permissão.' }
  }

  const texto = conteudo.trim()
  if (texto.length < 1 || texto.length > 4000) {
    return { success: false, error: 'A mensagem deve ter entre 1 e 4000 caracteres.' }
  }

  const { error } = await supabase.from('mensagens').insert({
    conversa_id: conversaId,
    remetente_id: user.id,
    conteudo: texto,
  })

  if (error) {
    console.error('Erro ao enviar mensagem. Código:', error.code)
    return { success: false, error: 'Não foi possível enviar a mensagem.' }
  }

  return { success: true }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Abre (ou reutiliza) a conversa do utilizador, na função de cliente, com uma empresa aprovada.
 * Usada pelo candidato a partir das suas candidaturas. A RLS impede conversas com a própria empresa.
 * Não é bloqueada para contas de profissional: o contacto com empresas mantém-se.
 */
export async function iniciarConversaComEmpresa(
  empresaId: string
): Promise<{ success: true; conversaId: string } | { success: false; error: string }> {
  if (!UUID_REGEX.test(empresaId)) return { success: false, error: 'Empresa inválida.' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const { data: existente, error: erroLeitura } = await supabase
    .from('conversas')
    .select('id')
    .eq('cliente_id', user.id)
    .eq('empresa_id', empresaId)
    .maybeSingle()

  if (erroLeitura) {
    console.error('Erro ao procurar conversa com empresa. Código:', erroLeitura.code)
    return { success: false, error: 'Não foi possível iniciar a conversa.' }
  }
  if (existente) return { success: true, conversaId: existente.id }

  // Só iniciar contacto com empresas aprovadas; a vista pública não expõe dados privados.
  const { data: empresaAprovada, error: erroAprovacao } = await supabase
    .from('empresas_publicas')
    .select('id')
    .eq('id', empresaId)
    .eq('is_approved', true)
    .maybeSingle()

  if (erroAprovacao || !empresaAprovada) {
    return { success: false, error: 'Empresa não encontrada ou indisponível para contacto.' }
  }

  const { data, error } = await supabase
    .from('conversas')
    .insert({ cliente_id: user.id, empresa_id: empresaId })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Erro ao criar conversa com empresa. Código:', error?.code)
    return { success: false, error: 'Não foi possível iniciar a conversa com a empresa.' }
  }

  revalidatePath('/mensagens')
  return { success: true, conversaId: data.id }
}

/**
 * Abre (ou reutiliza) a conversa do utilizador, na função de cliente, com um profissional aprovado.
 * A RLS só permite inserir como cliente, com profissional aprovado, e nunca consigo próprio.
 */
export async function iniciarConversaComProfissional(
  profissionalId: string
): Promise<{ success: true; conversaId: string } | { success: false; error: string }> {
  if (!UUID_REGEX.test(profissionalId)) return { success: false, error: 'Profissional inválido.' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const { data: existente, error: erroLeitura } = await supabase
    .from('conversas')
    .select('id')
    .eq('cliente_id', user.id)
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (erroLeitura) {
    console.error('Erro ao procurar conversa. Código:', erroLeitura.code)
    return { success: false, error: 'Não foi possível iniciar a conversa.' }
  }
  if (existente) return { success: true, conversaId: existente.id }

  // A vista contém apenas profissionais aprovados e é a fonte pública de elegibilidade.
  const { data: profissionalAprovado, error: erroAprovacao } = await supabase
    .from('profissionais_publicos')
    .select('id')
    .eq('id', profissionalId)
    .maybeSingle()

  if (erroAprovacao || !profissionalAprovado) {
    return { success: false, error: 'Profissional não encontrado ou indisponível para contacto.' }
  }

  const { data, error } = await supabase
    .from('conversas')
    .insert({ cliente_id: user.id, profissional_id: profissionalId })
    .select('id')
    .single()

  if (error?.code === '42501') {
    return { success: false, error: 'Não foi possível iniciar a conversa. Verifique se o profissional está aprovado e se tem permissão para o contacto.' }
  }

  if (error || !data) {
    console.error('Erro ao criar conversa. Código:', error?.code)
    return { success: false, error: 'Não foi possível iniciar a conversa. O profissional pode não estar disponível.' }
  }

  revalidatePath('/mensagens')
  return { success: true, conversaId: data.id }
}

export async function marcarMensagensLidas(conversaId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  if (!UUID_REGEX.test(conversaId) || !(await utilizadorParticipaNaConversa(supabase, conversaId, user.id))) {
    return { success: false, error: 'Conversa não encontrada ou sem permissão.' }
  }

  // A RLS continua a ser aplicada como segunda barreira.
  const { error } = await supabase
    .from('mensagens')
    .update({ lida_em: new Date().toISOString() })
    .eq('conversa_id', conversaId)
    .neq('remetente_id', user.id)
    .is('lida_em', null)

  if (error) {
    console.error('Erro ao marcar mensagens como lidas. Código:', error.code)
    return { success: false, error: 'Não foi possível atualizar as mensagens.' }
  }

  revalidatePath('/mensagens')
  revalidatePath('/empresa/painel/mensagens')
  return { success: true }
}
