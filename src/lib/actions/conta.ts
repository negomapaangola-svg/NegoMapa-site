'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export type ContaSnapshot = {
  user: { id: string; email: string }
  profile: any
  professional: any
  company: any
  details: any
  accountType: 'profissional' | 'empresa' | 'cliente'
}

async function authenticated() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login?redirectTo=/conta')
  return { supabase, user }
}

export async function getContaSnapshot(): Promise<ContaSnapshot | null> {
  const { supabase, user } = await authenticated()
  const [profileResult, professionalResult, companyResult, detailsResult] = await Promise.all([
    supabase.from('profiles').select('id,nome,telefone,whatsapp,avatar_url,account_type,localizacao_provincia,localizacao_municipio,localizacao_bairro,is_active').eq('id', user.id).maybeSingle(),
    supabase.from('profissionais').select('id,nome,telefone,whatsapp,bio,provincia,municipio,estado,avatar_url,categoria_id,especialidades,disponibilidade,disponibilidade_dias,disponibilidade_horarios,portfolio').eq('user_id', user.id).maybeSingle(),
    supabase.from('companies').select('id,name,sector,province,city,description,whatsapp,phone,logo_url,is_approved,estado,horario_atendimento,portfolio').eq('user_id', user.id).maybeSingle(),
    supabase.from('conta_detalhes').select('formacao,preferencias,disponibilidade,tipo_empresa,tamanho_empresa').eq('user_id', user.id).maybeSingle(),
  ])
  if (profileResult.error) throw new Error('Não foi possível carregar o perfil da conta.')
  const profile = profileResult.data
  const accountType = profile?.account_type
  if (accountType !== 'profissional' && accountType !== 'empresa' && accountType !== 'cliente') {
    redirect('/escolher-tipo')
  }
  return {
    user: { id: user.id, email: user.email ?? '' },
    profile: profile ?? {},
    professional: professionalResult.data ?? null,
    company: companyResult.data ?? null,
    details: detailsResult.data ?? {},
    accountType,
  }
}

function field(form: FormData, name: string) {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function validImageUrl(value: string) {
  if (!value) return false
  try {
    const url = new URL(value)
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    return Boolean(base && url.protocol === 'https:' && url.origin === new URL(base).origin && url.pathname.startsWith('/storage/v1/object/public/'))
  } catch {
    return false
  }
}

export async function guardarPerfilConta(form: FormData): Promise<void> {
  const { supabase, user } = await authenticated()
  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle()
  const tipo = profile?.account_type
  if (!['profissional', 'empresa', 'cliente'].includes(tipo)) redirect('/escolher-tipo')

  const nome = field(form, 'nome')
  const telefone = field(form, 'telefone')
  const whatsapp = field(form, 'whatsapp')
  if (nome.length < 2 || nome.length > 120 || /[<>]/.test(nome)) redirect('/conta/perfil?erro=nome')
  if (telefone.length > 32 || whatsapp.length > 32) redirect('/conta/perfil?erro=contacto')

  if (tipo === 'profissional') {
    const avatar = field(form, 'avatar_url')
    if (!validImageUrl(avatar)) redirect('/conta/perfil?erro=avatar')
    const especialidades = field(form, 'especialidades').split(',').map(v => v.trim()).filter(Boolean).slice(0, 20)
    const portfolioRaw = field(form, 'portfolio')
    let portfolio: unknown = []
    if (portfolioRaw) {
      try { portfolio = JSON.parse(portfolioRaw) } catch { redirect('/conta/perfil?erro=portfolio') }
      if (!Array.isArray(portfolio)) redirect('/conta/perfil?erro=portfolio')
    }
    const { data: owned } = await supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle()
    if (!owned) redirect('/conta/perfil?erro=sem-perfil')
    const { error } = await supabase.from('profissionais').update({
      nome, telefone: telefone || null, whatsapp: whatsapp || null, bio: field(form, 'bio') || null,
      provincia: field(form, 'provincia') || null, municipio: field(form, 'municipio') || null, bairro: field(form, 'bairro') || null,
      categoria_id: field(form, 'categoria_id') || null, especialidades,
      disponibilidade: field(form, 'disponibilidade') || null, avatar_url: avatar, portfolio,
    }).eq('user_id', user.id)
    if (error) redirect('/conta/perfil?erro=guardar')
  } else if (tipo === 'empresa') {
    const logo = field(form, 'logo_url')
    if (!validImageUrl(logo)) redirect('/conta/perfil?erro=avatar')
    const portfolioRaw = field(form, 'portfolio')
    let portfolio: unknown = []
    if (portfolioRaw) {
      try { portfolio = JSON.parse(portfolioRaw) } catch { redirect('/conta/perfil?erro=portfolio') }
      if (!Array.isArray(portfolio)) redirect('/conta/perfil?erro=portfolio')
    }
    const { data: owned } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()
    if (!owned) redirect('/conta/perfil?erro=sem-perfil')
    const { error } = await supabase.from('companies').update({
      name: nome, sector: field(form, 'sector') || 'Geral', phone: telefone || null,
      whatsapp: whatsapp || null, province: field(form, 'province') || '', city: field(form, 'city') || null,
      bairro: field(form, 'bairro') || null, rua: field(form, 'rua') || null, referencia_localizacao: field(form, 'referencia_localizacao') || null, website: field(form, 'website') || null,
      description: field(form, 'description') || null, horario_atendimento: field(form, 'disponibilidade') || null,
      logo_url: logo, portfolio,
    }).eq('user_id', user.id)
    if (error) redirect('/conta/perfil?erro=guardar')
  } else {
    const { error } = await supabase.from('profiles').update({
      nome, telefone: telefone || null, whatsapp: whatsapp || null,
      localizacao_provincia: field(form, 'provincia') || null,
      localizacao_municipio: field(form, 'municipio') || null,
      localizacao_bairro: field(form, 'bairro') || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    if (error) redirect('/conta/perfil?erro=guardar')
  }

  const details = {
    user_id: user.id,
    formacao: field(form, 'formacao') || null,
    preferencias: field(form, 'preferencias') || null,
    disponibilidade: field(form, 'disponibilidade') || null,
    tipo_empresa: field(form, 'tipo_empresa') || null,
    tamanho_empresa: field(form, 'tamanho_empresa') || null,
    updated_at: new Date().toISOString(),
  }
  const { error: detailsError } = await supabase.from('conta_detalhes').upsert(details, { onConflict: 'user_id' })
  if (detailsError) redirect('/conta/perfil?erro=detalhes')

  revalidatePath('/conta')
  revalidatePath('/conta/perfil')
  revalidatePath('/perfil')
  redirect('/conta/perfil?salvo=1')
}

export async function getContaConteudo() {
  const { supabase, user } = await authenticated()
  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle()
  const type = profile?.account_type
  const [professional, company] = await Promise.all([
    supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle(),
  ])
  if (type === 'profissional' && professional.data) {
    const { data } = await supabase.from('servicos').select('id,titulo,estado,created_at').eq('profissional_id', professional.data.id).order('created_at', { ascending: false }).limit(30)
    return { type, services: data ?? [], products: [], jobs: [], orders: [], applications: [] }
  }
  if (type === 'empresa' && company.data) {
    const [services, products, jobs] = await Promise.all([
      supabase.from('servicos').select('id,titulo,estado,created_at').eq('company_id', company.data.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('produtos').select('id,titulo,estado_aprovacao,criado_em').eq('company_id', company.data.id).order('criado_em', { ascending: false }).limit(30),
      supabase.from('vagas').select('id,titulo,estado,created_at').eq('company_id', company.data.id).order('created_at', { ascending: false }).limit(30),
    ])
    return { type, services: services.data ?? [], products: products.data ?? [], jobs: jobs.data ?? [], orders: [], applications: [] }
  }
  const [orders, applications] = await Promise.all([
    supabase.from('pedidos_servico').select('id,titulo,estado,criada_em').eq('cliente_id', user.id).order('criada_em', { ascending: false }).limit(30),
    supabase.from('candidaturas').select('id,nome_candidato,estado,criada_em').eq('user_id', user.id).order('criada_em', { ascending: false }).limit(30),
  ])
  return { type, services: [], products: [], jobs: [], orders: orders.data ?? [], applications: applications.data ?? [] }
}

export async function getContaMensagens() {
  const { supabase, user } = await authenticated()
  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle()
  const type = profile?.account_type
  let query = supabase.from('conversas').select('id,criada_em').eq('cliente_id', user.id)
  if (type === 'profissional') {
    const { data: own } = await supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle()
    query = supabase.from('conversas').select('id,criada_em').eq('profissional_id', own?.id ?? '00000000-0000-0000-0000-000000000000')
  } else if (type === 'empresa') {
    const { data: own } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()
    query = supabase.from('conversas').select('id,criada_em').eq('empresa_id', own?.id ?? '00000000-0000-0000-0000-000000000000')
  }
  const { data: conversations } = await query.order('criada_em', { ascending: false }).limit(50)
  const ids = (conversations ?? []).map(c => c.id)
  if (!ids.length) return []
  const { data: messages } = await supabase.from('mensagens').select('id,conversa_id,remetente_id,conteudo,lida_em,criada_em').in('conversa_id', ids).order('criada_em', { ascending: false }).limit(100)
  return (messages ?? []).map(message => ({ ...message, isMine: message.remetente_id === user.id }))
}

export async function getContaAvaliacoes() {
  const { supabase, user } = await authenticated()
  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle()
  const [professional, company, given] = await Promise.all([
    supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('avaliacoes').select('id,nota,comentario,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ])
  let received: any[] = []
  if (profile?.account_type === 'profissional' && professional.data) {
    const { data } = await supabase.from('avaliacoes').select('id,nota,comentario,created_at').eq('profissional_id', professional.data.id).order('created_at', { ascending: false }).limit(50)
    received = data ?? []
  } else if (profile?.account_type === 'empresa' && company.data) {
    const { data } = await supabase.from('avaliacoes').select('id,nota,comentario,created_at').eq('company_id', company.data.id).order('created_at', { ascending: false }).limit(50)
    received = data ?? []
  }
  return { type: profile?.account_type, received, given: given.data ?? [] }
}

export async function guardarNotificacoesConta(form: FormData): Promise<void> {
  const { supabase, user } = await authenticated()
  const { error } = await supabase.from('preferencias_notificacao').upsert({
    user_id: user.id,
    plataforma: form.get('plataforma') === 'on',
    email: form.get('email') === 'on',
    whatsapp: form.get('whatsapp') === 'on',
    atualizada_em: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) redirect('/conta/configuracoes?erro=notificacoes')
  revalidatePath('/conta/configuracoes')
  redirect('/conta/configuracoes?salvo=1')
}

export async function alterarPalavraPasse(form: FormData): Promise<void> {
  const { supabase } = await authenticated()
  const password = field(form, 'password')
  const confirmation = field(form, 'confirmation')
  if (password.length < 10 || password.length > 128 || password !== confirmation) redirect('/conta/configuracoes?erro=password')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect('/conta/configuracoes?erro=password')
  redirect('/conta/configuracoes?password=1')
}

export async function terminarTodasSessoes(): Promise<void> {
  const { supabase } = await authenticated()
  await supabase.auth.signOut({ scope: 'global' })
  redirect('/login?logout=1')
}

export async function solicitarEliminacaoConta(form: FormData): Promise<void> {
  const { supabase, user } = await authenticated()
  if (field(form, 'confirmacao') !== 'ELIMINAR') redirect('/conta/configuracoes?erro=confirmacao')
  const motivo = field(form, 'motivo')
  if (motivo.length < 10 || motivo.length > 1000) redirect('/conta/configuracoes?erro=motivo')
  const { error } = await supabase.from('admin_messages').insert({
    sender_id: user.id,
    recipient_id: null,
    parent_id: null,
    subject: 'Pedido de eliminação de conta',
    body: 'O utilizador confirmou explicitamente ELIMINAR e solicita a eliminação da sua conta. Motivo: ' + motivo,
  })
  if (error) redirect('/conta/configuracoes?erro=pedido')
  revalidatePath('/conta/configuracoes')
  redirect('/conta/configuracoes?pedido=1')
}
