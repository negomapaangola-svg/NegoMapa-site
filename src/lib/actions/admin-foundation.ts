'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type AdminMetric = number | null

export type AdminDashboardStats = {
  visitorsTotal: AdminMetric
  visitorsActive: AdminMetric
  accountsTotal: AdminMetric
  accountsClient: AdminMetric
  accountsProfessional: AdminMetric
  accountsCompany: AdminMetric
  accountsLast7Days: AdminMetric
  accountsLast30Days: AdminMetric
  professionalsTotal: AdminMetric
  professionalsPending: AdminMetric
  professionalsApproved: AdminMetric
  professionalsRejected: AdminMetric
  companiesTotal: AdminMetric
  companiesPending: AdminMetric
  companiesApproved: AdminMetric
  companiesRejected: AdminMetric
  servicesTotal: AdminMetric
  productsTotal: AdminMetric
  vacanciesTotal: AdminMetric
  applicationsTotal: AdminMetric
  requestsTotal: AdminMetric
  messagesTotal: AdminMetric
  messagesUnread: AdminMetric
  alertsTotal: AdminMetric
}

async function countResult(
  query: PromiseLike<{ count: number | null; error: { code?: string } | null }>
): Promise<AdminMetric> {
  const result = await query
  if (result.error) {
    console.error('[admin-stats] count unavailable:', result.error.code ?? 'unknown')
    return null
  }
  return result.count
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  if (!(await isAdmin())) return null

  const supabase = await createSupabaseServerClient()
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const results = await Promise.all([
    // Não existe fonte de analytics/visitas na base auditada.
    Promise.resolve(null),
    Promise.resolve(null),
    countResult(supabase.from('profiles').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_type', 'cliente')),
    countResult(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_type', 'profissional')),
    countResult(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_type', 'empresa')),
    countResult(supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since7)),
    countResult(supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since30)),
    countResult(supabase.from('profissionais').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('profissionais').select('id', { count: 'exact', head: true }).eq('estado', 'pendente')),
    countResult(supabase.from('profissionais').select('id', { count: 'exact', head: true }).eq('estado', 'aprovado')),
    countResult(supabase.from('profissionais').select('id', { count: 'exact', head: true }).eq('estado', 'rejeitado')),
    countResult(supabase.from('companies').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('companies').select('id', { count: 'exact', head: true }).or('estado.eq.pendente,is_approved.eq.false')),
    countResult(supabase.from('companies').select('id', { count: 'exact', head: true }).or('estado.eq.aprovado,is_approved.eq.true')),
    countResult(supabase.from('companies').select('id', { count: 'exact', head: true }).eq('estado', 'rejeitado')),
    countResult(supabase.from('servicos').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('produtos').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('vagas').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('candidaturas').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('pedidos_servico').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('admin_messages').select('id', { count: 'exact', head: true })),
    countResult(supabase.from('admin_messages').select('id', { count: 'exact', head: true }).is('recipient_id', null).is('read_at', null).is('archived_at', null)),
    countResult(supabase.from('denuncias').select('id', { count: 'exact', head: true })),
  ])

  return {
    visitorsTotal: results[0],
    visitorsActive: results[1],
    accountsTotal: results[2],
    accountsClient: results[3],
    accountsProfessional: results[4],
    accountsCompany: results[5],
    accountsLast7Days: results[6],
    accountsLast30Days: results[7],
    professionalsTotal: results[8],
    professionalsPending: results[9],
    professionalsApproved: results[10],
    professionalsRejected: results[11],
    companiesTotal: results[12],
    companiesPending: results[13],
    companiesApproved: results[14],
    companiesRejected: results[15],
    servicesTotal: results[16],
    productsTotal: results[17],
    vacanciesTotal: results[18],
    applicationsTotal: results[19],
    requestsTotal: results[20],
    messagesTotal: results[21],
    messagesUnread: results[22],
    alertsTotal: results[23],
  }
}

export type AdminMessageFilter = 'all' | 'unread' | 'read' | 'archived'

export type AdminMessage = {
  id: string
  sender_id: string
  subject: string
  body: string
  created_at: string
  read_at: string | null
  archived_at: string | null
  sender_name: string
}

export async function getAdminMessages(filter: AdminMessageFilter = 'all'): Promise<AdminMessage[] | null> {
  if (!(await isAdmin())) return null

  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('admin_messages')
    .select('id,sender_id,subject,body,created_at,read_at,archived_at')
    .is('recipient_id', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter === 'unread') query = query.is('read_at', null).is('archived_at', null)
  if (filter === 'read') query = query.not('read_at', 'is', null).is('archived_at', null)
  if (filter === 'archived') query = query.not('archived_at', 'is', null)

  const { data, error } = await query
  if (error) {
    console.error('[admin-messages] list failed:', error.code)
    return null
  }

  const rows = data ?? []
  const senderIds = Array.from(new Set(rows.map((row) => row.sender_id)))
  const { data: profiles } = senderIds.length
    ? await supabase.from('profiles').select('id,nome').in('id', senderIds)
    : { data: [] as { id: string; nome: string | null }[] }

  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.nome]))
  return rows.map((row) => ({
    ...row,
    sender_name: names.get(row.sender_id) || 'Utilizador',
  }))
}

export async function markAdminMessageRead(messageId: string): Promise<{ success: boolean; error?: string }> {
  if (!UUID_RE.test(messageId) || !(await isAdmin())) {
    return { success: false, error: 'Acesso negado ou mensagem inválida.' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('admin_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('recipient_id', null)

  if (error) return { success: false, error: 'Não foi possível actualizar a mensagem.' }
  revalidatePath('/admin')
  revalidatePath('/admin/mensagens')
  return { success: true }
}

export async function archiveAdminMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  if (!UUID_RE.test(messageId) || !(await isAdmin())) {
    return { success: false, error: 'Acesso negado ou mensagem inválida.' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('admin_messages')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('recipient_id', null)

  if (error) return { success: false, error: 'Não foi possível arquivar a mensagem.' }
  revalidatePath('/admin')
  revalidatePath('/admin/mensagens')
  return { success: true }
}

export async function replyToAdminMessage(
  messageId: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  if (!UUID_RE.test(messageId) || typeof body !== 'string' || body.trim().length < 1 || body.trim().length > 5000) {
    return { success: false, error: 'Resposta inválida.' }
  }
  if (!(await isAdmin())) return { success: false, error: 'Acesso negado.' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const { data: original, error: readError } = await supabase
    .from('admin_messages')
    .select('id,sender_id,subject')
    .eq('id', messageId)
    .is('recipient_id', null)
    .maybeSingle()

  if (readError || !original) return { success: false, error: 'Mensagem original não encontrada.' }

  const subject = original.subject.toLowerCase().startsWith('re:')
    ? original.subject
    : `Re: ${original.subject}`

  const { error } = await supabase.from('admin_messages').insert({
    sender_id: user.id,
    recipient_id: original.sender_id,
    parent_id: original.id,
    subject: subject.slice(0, 160),
    body: body.trim(),
  })

  if (error) {
    console.error('[admin-messages] reply failed:', error.code)
    return { success: false, error: 'Não foi possível enviar a resposta.' }
  }

  await markAdminMessageRead(messageId)
  revalidatePath('/admin/mensagens')
  return { success: true }
}

export async function sendMessageToAdmin(
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 160) {
    return { success: false, error: 'O assunto deve ter entre 3 e 160 caracteres.' }
  }
  if (typeof body !== 'string' || body.trim().length < 1 || body.trim().length > 5000) {
    return { success: false, error: 'A mensagem deve ter entre 1 e 5000 caracteres.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inicie sessão para contactar a administração.' }

  const { error } = await supabase.from('admin_messages').insert({
    sender_id: user.id,
    recipient_id: null,
    parent_id: null,
    subject: subject.trim(),
    body: body.trim(),
  })

  if (error) {
    console.error('[admin-messages] submit failed:', error.code)
    return { success: false, error: 'Não foi possível enviar a mensagem.' }
  }
  revalidatePath('/mensagens/administracao')
  return { success: true }
}

export async function getMyAdminMessages(): Promise<Array<{
  id: string
  subject: string
  body: string
  created_at: string
  read_at: string | null
  recipient_id: string | null
}> | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('admin_messages')
    .select('id,subject,body,created_at,read_at,recipient_id')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('[admin-messages] own list failed:', error.code)
    return null
  }
  return data ?? []
}
