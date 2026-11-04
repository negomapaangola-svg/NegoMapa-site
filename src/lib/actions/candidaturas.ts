'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export type EstadoCandidatura = 'enviada' | 'vista' | 'em_analise' | 'aceite' | 'rejeitada' | 'arquivada'

export type CandidaturaCandidato = {
  id: string
  estado: EstadoCandidatura | string
  criada_em: string
  vaga: { titulo: string; slug: string; company_id: string } | null
}

export type CandidaturaEmpresa = {
  id: string
  vaga_id: string
  nome_candidato: string
  mensagem: string
  cv_url: string | null
  contacto: string | null
  estado: EstadoCandidatura | string
  criada_em: string
  vaga: { titulo: string; slug: string } | null
  conversa_id: string | null
}

export type ResultadoCandidatura = { success: boolean; error?: string }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Resultado<T> = { success: true; data: T } | { success: false; error: string }

const ESTADOS_CANDIDATURA: readonly EstadoCandidatura[] = [
  'enviada',
  'vista',
  'em_analise',
  'aceite',
  'rejeitada',
  'arquivada',
]

const ROTULOS_ESTADO: Record<EstadoCandidatura, string> = {
  enviada: 'Enviada',
  vista: 'Vista',
  em_analise: 'Em análise',
  aceite: 'Aceite',
  rejeitada: 'Rejeitada',
  arquivada: 'Arquivada',
}

async function criarNotificacao(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  tipo: string,
  titulo: string,
  corpo: string,
  referenciaId: string | null
): Promise<void> {
  const { data: preferencias } = await supabase
    .from('preferencias_notificacao')
    .select('plataforma')
    .eq('user_id', userId)
    .maybeSingle()

  if (preferencias && !preferencias.plataforma) {
    return
  }

  await supabase.from('notificacoes').insert({
    user_id: userId,
    tipo,
    titulo,
    corpo,
    canal: 'plataforma',
    referencia_id: referenciaId,
  })
}

export async function listarMinhasCandidaturas(): Promise<Resultado<CandidaturaCandidato[]>> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const { data, error } = await supabase
    .from('candidaturas')
    .select('id, estado, criada_em, vaga:vagas!vaga_id(titulo, slug, company_id)')
    .eq('user_id', user.id)
    .order('criada_em', { ascending: false })

  if (error) {
    console.error('Erro ao listar candidaturas do candidato. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar as candidaturas.' }
  }

  return { success: true, data: (data ?? []) as unknown as CandidaturaCandidato[] }
}

export async function criarCandidatura(vagaId: string, formData: FormData): Promise<ResultadoCandidatura> {
  if (!UUID_REGEX.test(vagaId)) return { success: false, error: 'Vaga inválida.' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const nome = String(formData.get('nome_candidato') ?? '').trim()
  const mensagem = String(formData.get('mensagem') ?? '').trim()
  const cvUrl = String(formData.get('cv_url') ?? '').trim()
  const contacto = String(formData.get('contacto') ?? '').trim()

  if (nome.length < 3 || nome.length > 120) {
    return { success: false, error: 'O nome deve ter entre 3 e 120 caracteres.' }
  }
  if (contacto.length === 0) {
    return { success: false, error: 'Indique um contacto: telefone, WhatsApp ou email.' }
  }
  if (contacto.length < 5 || contacto.length > 120) {
    return { success: false, error: 'O contacto deve ter entre 5 e 120 caracteres.' }
  }
  if (mensagem.length < 10 || mensagem.length > 2000) {
    return { success: false, error: 'A mensagem deve ter entre 10 e 2000 caracteres.' }
  }
  if (cvUrl && (!/^https:\/\//.test(cvUrl) || cvUrl.length > 500)) {
    return { success: false, error: 'O link do CV deve começar por https:// e ter até 500 caracteres.' }
  }

  const { data: vaga, error: vagaError } = await supabase
    .from('vagas')
    .select('id, titulo, company_id')
    .eq('id', vagaId)
    .maybeSingle()

  if (vagaError || !vaga) {
    return { success: false, error: 'Vaga não encontrada.' }
  }

  const { data: empresa, error: empresaError } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', vaga.company_id)
    .maybeSingle()

  const { data: candidatura, error } = await supabase
    .from('candidaturas')
    .insert({
      vaga_id: vagaId,
      user_id: user.id,
      nome_candidato: nome,
      mensagem,
      cv_url: cvUrl || null,
      contacto,
      estado: 'enviada',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já se candidatou a esta vaga.' }
    }
    if (error.code === '42501') {
      return {
        success: false,
        error: 'Não foi possível enviar a candidatura. Confirma que a vaga está disponível e que tens permissão para te candidatares.',
      }
    }
    console.error('Erro ao criar candidatura. Código:', error.code)
    return { success: false, error: 'Não foi possível enviar a candidatura. Verifique se a vaga ainda está aberta.' }
  }

  if (empresa?.user_id) {
    await criarNotificacao(
      supabase,
      empresa.user_id,
      'candidatura_nova',
      'Nova candidatura recebida',
      `${nome} candidatou-se à vaga “${vaga.titulo}”.`,
      candidatura.id
    )
  }

  revalidatePath('/candidaturas')
  revalidatePath('/empresa/painel/candidaturas')
  return { success: true }
}

export async function listarCandidaturasDaEmpresa(): Promise<Resultado<CandidaturaEmpresa[]>> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const { data, error } = await supabase
    .from('candidaturas')
    .select('id, vaga_id, nome_candidato, mensagem, cv_url, contacto, estado, criada_em, user_id, vaga:vagas!vaga_id(titulo, slug)')
    .order('criada_em', { ascending: false })

  if (error) {
    console.error('Erro ao listar candidaturas da empresa. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar as candidaturas.' }
  }

  const linhas = (data ?? []) as Array<Record<string, unknown> & { user_id: string }>

  const { data: empresa } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const conversaPorCliente = new Map<string, string>()
  if (empresa?.id) {
    const { data: conversas, error: erroConversas } = await supabase
      .from('conversas')
      .select('id, cliente_id')
      .eq('empresa_id', empresa.id)

    if (erroConversas) {
      console.error('Erro ao ligar candidaturas a conversas. Código:', erroConversas.code)
    } else {
      for (const conversa of conversas ?? []) {
        conversaPorCliente.set(conversa.cliente_id, conversa.id)
      }
    }
  }

  const resultado: CandidaturaEmpresa[] = linhas.map(({ user_id, ...resto }) => ({
    ...(resto as Omit<CandidaturaEmpresa, 'conversa_id'>),
    conversa_id: conversaPorCliente.get(user_id) ?? null,
  }))

  return { success: true, data: resultado }
}

export async function atualizarEstadoCandidatura(
  candidaturaId: string,
  estado: EstadoCandidatura
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  if (!ESTADOS_CANDIDATURA.includes(estado)) {
    return { success: false, error: 'Estado inválido.' }
  }

  const { data: candidatura, error: leituraError } = await supabase
    .from('candidaturas')
    .select('id, user_id, estado')
    .eq('id', candidaturaId)
    .maybeSingle()

  if (leituraError || !candidatura) {
    return { success: false, error: 'Candidatura não encontrada.' }
  }

  const { data, error } = await supabase
    .from('candidaturas')
    .update({ estado })
    .eq('id', candidaturaId)
    .select('id')

  if (error) {
    console.error('Erro ao atualizar candidatura. Código:', error.code)
    return { success: false, error: 'Não foi possível atualizar o estado da candidatura.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'Não tem permissão para alterar esta candidatura.' }
  }

  if (candidatura.user_id && candidatura.estado !== estado) {
    await criarNotificacao(
      supabase,
      candidatura.user_id,
      'candidatura_estado',
      'Estado da candidatura atualizado',
      `A sua candidatura passou para “${ROTULOS_ESTADO[estado]}”.`,
      candidatura.id
    )
  }

  revalidatePath('/empresa/painel/candidaturas')
  revalidatePath('/candidaturas')
  return { success: true }
}
