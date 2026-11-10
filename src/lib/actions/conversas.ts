'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
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
  /** Nome do interlocutor: profissional ou empresa (para clientes); "Cliente" nos outros casos. */
  nome_interlocutor: string
  ultima_mensagem: string | null
  ultima_mensagem_em: string | null
  /** Mensagens recebidas e ainda não lidas nesta conversa. */
  nao_lidas: number
}

type LinhaMensagemResumo = {
  conversa_id: string
  remetente_id: string
  conteudo: string
  lida_em: string | null
  criada_em: string
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

  // A política RLS também permite leitura administrativa. A interface de mensagens,
  // porém, só deve devolver conversas em que a sessão actual é participante efectivo.
  const minhasConversas = (data ?? []).filter((conversa) =>
    conversa.cliente_id === user.id ||
    Boolean(conversa.profissional_id && idsProfissional.has(conversa.profissional_id)) ||
    Boolean(conversa.empresa_id && idsEmpresa.has(conversa.empresa_id))
  )

  const conversasBase = minhasConversas.map((conversa) => {
    let papel: PapelConversa = 'cliente'
    if (conversa.cliente_id === user.id) {
      papel = 'cliente'
    } else if (conversa.profissional_id && idsProfissional.has(conversa.profissional_id)) {
      papel = 'profissional'
    } else if (conversa.empresa_id && idsEmpresa.has(conversa.empresa_id)) {
      papel = 'empresa'
    }
    return { ...conversa, papel }
  })

  const idsConversas = conversasBase.map((c) => c.id)
  const idsProfissionaisConversas = conversasBase.map((c) => c.profissional_id).filter((id): id is string => !!id)
  const idsEmpresasConversas = conversasBase.map((c) => c.empresa_id).filter((id): id is string => !!id)

  // Últimas mensagens (limite fixo) para calcular pré-visualização e não lidas. A RLS limita às conversas do utilizador.
  const resMensagens = idsConversas.length > 0
    ? await supabase
        .from('mensagens')
        .select('conversa_id, remetente_id, conteudo, lida_em, criada_em')
        .in('conversa_id', idsConversas)
        .order('criada_em', { ascending: false })
        .limit(1000)
    : null
  const resProfissionais = idsProfissionaisConversas.length > 0
    ? await supabase.from('profissionais_publicos').select('id, nome').in('id', idsProfissionaisConversas)
    : null
  const resEmpresas = idsEmpresasConversas.length > 0
    ? await supabase.from('empresas_publicas').select('id, name').in('id', idsEmpresasConversas)
    : null

  const mensagens = (resMensagens?.data ?? []) as LinhaMensagemResumo[]
  const ultimaPorConversa = new Map<string, LinhaMensagemResumo>()
  const naoLidasPorConversa = new Map<string, number>()
  for (const mensagem of mensagens) {
    if (!ultimaPorConversa.has(mensagem.conversa_id)) ultimaPorConversa.set(mensagem.conversa_id, mensagem)
    if (mensagem.remetente_id !== user.id && mensagem.lida_em === null) {
      naoLidasPorConversa.set(mensagem.conversa_id, (naoLidasPorConversa.get(mensagem.conversa_id) ?? 0) + 1)
    }
  }
  const nomesProfissionais = new Map(((resProfissionais?.data ?? []) as { id: string; nome: string | null }[]).map((p) => [p.id, p.nome]))
  const nomesEmpresas = new Map(((resEmpresas?.data ?? []) as { id: string; name: string | null }[]).map((e) => [e.id, e.name]))

  const conversas: ConversaResumo[] = conversasBase.map((conversa) => {
    const ultima = ultimaPorConversa.get(conversa.id)
    let nome = 'Cliente'
    if (conversa.papel === 'cliente') {
      if (conversa.profissional_id) nome = nomesProfissionais.get(conversa.profissional_id) || 'Profissional'
      else if (conversa.empresa_id) nome = nomesEmpresas.get(conversa.empresa_id) || 'Empresa'
      else nome = 'Contacto'
    }
    return {
      ...conversa,
      nome_interlocutor: nome,
      ultima_mensagem: ultima ? ultima.conteudo : null,
      ultima_mensagem_em: ultima ? ultima.criada_em : null,
      nao_lidas: naoLidasPorConversa.get(conversa.id) ?? 0,
    }
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

  // A notificação nunca bloqueia o envio da mensagem.
  try {
    await notificarNovaMensagem(conversaId, user.id)
  } catch {
    console.error('Erro ao criar notificação de nova mensagem.')
  }

  return { success: true }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Cliente de serviço, só no servidor, para criar notificações (a tabela não permite INSERT ao utilizador).
 * Devolve null se a chave ou o URL não estiverem configurados.
 */
function criarClienteServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) return null
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
}

/**
 * Cria uma notificação de plataforma para o outro participante.
 * Não expõe o conteúdo da mensagem, não notifica o remetente e não duplica uma notificação ainda por ler.
 */
async function notificarNovaMensagem(conversaId: string, remetenteId: string): Promise<void> {
  const admin = criarClienteServico()
  if (!admin) return

  const { data: conversa } = await admin
    .from('conversas')
    .select('cliente_id, profissional_id, empresa_id')
    .eq('id', conversaId)
    .maybeSingle()
  if (!conversa) return

  let destinatario: string | null = null
  if (conversa.cliente_id === remetenteId) {
    if (conversa.profissional_id) {
      const { data } = await admin.from('profissionais').select('user_id').eq('id', conversa.profissional_id).maybeSingle()
      destinatario = data?.user_id ?? null
    } else if (conversa.empresa_id) {
      const { data } = await admin.from('companies').select('user_id').eq('id', conversa.empresa_id).maybeSingle()
      destinatario = data?.user_id ?? null
    }
  } else {
    destinatario = conversa.cliente_id
  }
  if (!destinatario || destinatario === remetenteId) return

  const { data: preferencias } = await admin
    .from('preferencias_notificacao')
    .select('plataforma')
    .eq('user_id', destinatario)
    .maybeSingle()
  if (preferencias && !preferencias.plataforma) return

  const { count } = await admin
    .from('notificacoes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', destinatario)
    .eq('tipo', 'nova_mensagem')
    .eq('referencia_id', conversaId)
    .eq('lida', false)
  if ((count ?? 0) > 0) return

  const { error } = await admin.rpc('criar_notificacao', {
    p_user_id: destinatario,
    p_tipo: 'nova_mensagem',
    p_titulo: 'Nova mensagem',
    p_corpo: 'Recebeu uma nova mensagem no NegóMapa. Abra a conversa para a ler.',
    p_canal: 'plataforma',
    p_referencia_id: conversaId,
  })
  if (error) console.error('Erro ao criar notificação de nova mensagem. Código:', error.code)
}

/**
 * Regras de contacto: ninguém contacta o próprio perfil/empresa, e o destino tem de estar aprovado.
 * Serve as páginas (para mostrar o botão) e as ações abaixo (para validar no servidor).
 * A RLS continua a ser a barreira final na inserção.
 */
export async function verificarPodeContactar(
  alvo: { tipo: 'profissional' | 'empresa'; id: string }
): Promise<{ pode: boolean; motivo?: string }> {
  if (!UUID_REGEX.test(alvo.id)) return { pode: false, motivo: 'Destino inválido.' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pode: false, motivo: 'Sessão expirada. Inicie sessão novamente.' }

  if (alvo.tipo === 'profissional') {
    const { data: proprio, error: erroProprio } = await supabase
      .from('profissionais')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (erroProprio) return { pode: false, motivo: 'Não foi possível verificar o contacto.' }
    if (proprio?.id === alvo.id) return { pode: false, motivo: 'Não pode contactar o seu próprio perfil.' }

    // A vista contém apenas profissionais aprovados.
    const { data: aprovado } = await supabase
      .from('profissionais_publicos')
      .select('id')
      .eq('id', alvo.id)
      .maybeSingle()
    if (!aprovado) return { pode: false, motivo: 'Profissional não encontrado ou indisponível para contacto.' }
    return { pode: true }
  }

  const { data: minhasEmpresas, error: erroEmpresas } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
  if (erroEmpresas) return { pode: false, motivo: 'Não foi possível verificar o contacto.' }
  if ((minhasEmpresas ?? []).some((empresa) => empresa.id === alvo.id)) {
    return { pode: false, motivo: 'Não pode contactar a sua própria empresa.' }
  }

  const { data: aprovada } = await supabase
    .from('empresas_publicas')
    .select('id')
    .eq('id', alvo.id)
    .eq('is_approved', true)
    .maybeSingle()
  if (!aprovada) return { pode: false, motivo: 'Empresa não encontrada ou indisponível para contacto.' }
  return { pode: true }
}

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

  // Regras: não é a própria empresa e o destino tem de estar aprovado.
  const permissao = await verificarPodeContactar({ tipo: 'empresa', id: empresaId })
  if (!permissao.pode) {
    return { success: false, error: permissao.motivo ?? 'Empresa indisponível para contacto.' }
  }

  // INSERT sem RETURNING: a RLS de SELECT não é avaliada sobre a linha recém-inserida.
  const { error } = await supabase
    .from('conversas')
    .insert({ cliente_id: user.id, empresa_id: empresaId })

  // 23505: a conversa já existe (inserção concorrente). Nesse caso lê-se a existente.
  if (error && error.code !== '23505') {
    console.error('Erro ao criar conversa com empresa. Código:', error.code)
    return { success: false, error: 'Não foi possível iniciar a conversa com a empresa.' }
  }

  // Leitura separada, após o INSERT, já com a linha committed.
  const { data: criada, error: erroLeituraFinal } = await supabase
    .from('conversas')
    .select('id')
    .eq('cliente_id', user.id)
    .eq('empresa_id', empresaId)
    .maybeSingle()

  if (erroLeituraFinal || !criada) {
    console.error('Erro ao obter conversa com empresa. Código:', erroLeituraFinal?.code)
    return { success: false, error: 'Não foi possível iniciar a conversa com a empresa.' }
  }

  revalidatePath('/mensagens')
  return { success: true, conversaId: criada.id }
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

  // Regras: não é o próprio perfil e o destino tem de estar aprovado.
  const permissao = await verificarPodeContactar({ tipo: 'profissional', id: profissionalId })
  if (!permissao.pode) {
    return { success: false, error: permissao.motivo ?? 'Profissional indisponível para contacto.' }
  }

  // INSERT sem RETURNING: a RLS de SELECT não é avaliada sobre a linha recém-inserida.
  const { error } = await supabase
    .from('conversas')
    .insert({ cliente_id: user.id, profissional_id: profissionalId })

  if (error?.code === '42501') {
    return { success: false, error: 'Não foi possível iniciar a conversa. Verifique se o profissional está aprovado e se tem permissão para o contacto.' }
  }

  // 23505: a conversa já existe (inserção concorrente). Nesse caso lê-se a existente.
  if (error && error.code !== '23505') {
    console.error('Erro ao criar conversa. Código:', error.code)
    return { success: false, error: 'Não foi possível iniciar a conversa. O profissional pode não estar disponível.' }
  }

  // Leitura separada, após o INSERT, já com a linha committed.
  const { data: criada, error: erroLeituraFinal } = await supabase
    .from('conversas')
    .select('id')
    .eq('cliente_id', user.id)
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (erroLeituraFinal || !criada) {
    console.error('Erro ao obter conversa. Código:', erroLeituraFinal?.code)
    return { success: false, error: 'Não foi possível iniciar a conversa. O profissional pode não estar disponível.' }
  }

  revalidatePath('/mensagens')
  return { success: true, conversaId: criada.id }
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

  // Ao abrir a conversa, a notificação de nova mensagem desta conversa passa a lida (só as do próprio utilizador).
  const { error: erroNotificacao } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('user_id', user.id)
    .eq('tipo', 'nova_mensagem')
    .eq('referencia_id', conversaId)
    .eq('lida', false)
  if (erroNotificacao) console.error('Erro ao marcar notificação de mensagem. Código:', erroNotificacao.code)

  revalidatePath('/mensagens')
  revalidatePath('/empresa/painel/mensagens')
  return { success: true }
}
