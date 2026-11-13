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

const METRIC_KEYS: Array<keyof AdminDashboardStats> = [
  'visitorsTotal', 'visitorsActive', 'accountsTotal', 'accountsClient',
  'accountsProfessional', 'accountsCompany', 'accountsLast7Days', 'accountsLast30Days',
  'professionalsTotal', 'professionalsPending', 'professionalsApproved', 'professionalsRejected',
  'companiesTotal', 'companiesPending', 'companiesApproved', 'companiesRejected',
  'servicesTotal', 'productsTotal', 'vacanciesTotal', 'applicationsTotal',
  'requestsTotal', 'messagesTotal', 'messagesUnread', 'alertsTotal',
]

function emptyDashboardStats(): AdminDashboardStats {
  return Object.fromEntries(METRIC_KEYS.map((key) => [key, null])) as AdminDashboardStats
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  if (!(await isAdmin())) return null

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('admin_dashboard_stats')

  if (error || !data || typeof data !== 'object') {
    console.error('[admin-stats] aggregate unavailable:', error?.code ?? 'migration-pending')
    return emptyDashboardStats()
  }

  const result = emptyDashboardStats()
  const values = data as Record<string, unknown>
  for (const key of METRIC_KEYS) {
    if (key === 'visitorsTotal' || key === 'visitorsActive') continue
    const value = values[key]
    result[key] = typeof value === 'number' && Number.isFinite(value) ? value : null
  }
  return result
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
  const { data, error } = await supabase.rpc('admin_list_messages', { p_filter: filter })

  if (error) {
    console.error('[admin-messages] list failed:', error.code)
    return null
  }
  return (data ?? []) as AdminMessage[]
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
