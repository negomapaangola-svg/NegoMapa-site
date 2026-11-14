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
  servicesActive: AdminMetric
  productsTotal: AdminMetric
  productsActive: AdminMetric
  vacanciesTotal: AdminMetric
  vacanciesActive: AdminMetric
  applicationsTotal: AdminMetric
  requestsTotal: AdminMetric
  messagesTotal: AdminMetric
  messagesInboxTotal: AdminMetric
  messagesUnread: AdminMetric
  alertsTotal: AdminMetric
}

const METRIC_KEYS: Array<keyof AdminDashboardStats> = [
  'visitorsTotal', 'visitorsActive', 'accountsTotal', 'accountsClient',
  'accountsProfessional', 'accountsCompany', 'accountsLast7Days', 'accountsLast30Days',
  'professionalsTotal', 'professionalsPending', 'professionalsApproved', 'professionalsRejected',
  'companiesTotal', 'companiesPending', 'companiesApproved', 'companiesRejected',
  'servicesTotal', 'servicesActive', 'productsTotal', 'productsActive', 'vacanciesTotal', 'vacanciesActive', 'applicationsTotal',
  'requestsTotal', 'messagesTotal', 'messagesInboxTotal', 'messagesUnread', 'alertsTotal',
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
  const [services, products, vacancies, inbox] = await Promise.all([
    supabase.from('servicos').select('id', { count: 'exact', head: true }).eq('estado', 'aprovado'),
    supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('estado_aprovacao', 'aprovado'),
    supabase.from('vagas').select('id', { count: 'exact', head: true }).eq('estado', 'aprovado'),
    supabase.from('admin_messages').select('id', { count: 'exact', head: true }).is('recipient_id', null),
  ])
  result.servicesActive = services.error ? null : services.count ?? 0
  result.productsActive = products.error ? null : products.count ?? 0
  result.vacanciesActive = vacancies.error ? null : vacancies.count ?? 0
  result.messagesInboxTotal = inbox.error ? null : inbox.count ?? 0
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
  const { data, error } = await supabase
    .from('admin_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('recipient_id', null)
    .select('id')

  if (error || !data?.length) return { success: false, error: 'Não foi possível actualizar a mensagem ou a mensagem já não está disponível.' }
  revalidatePath('/admin')
  revalidatePath('/admin/mensagens')
  return { success: true }
}

export async function archiveAdminMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  if (!UUID_RE.test(messageId) || !(await isAdmin())) {
    return { success: false, error: 'Acesso negado ou mensagem inválida.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('admin_messages')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('recipient_id', null)
    .select('id')

  if (error || !data?.length) return { success: false, error: 'Não foi possível arquivar a mensagem ou a mensagem já não está disponível.' }
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


export type AdminActivityMetricId =
  | 'accounts'
  | 'professionals'
  | 'companies'
  | 'services'
  | 'products'
  | 'vacancies'
  | 'applications'
  | 'requests'
  | 'messages'
  | 'alerts'

export type AdminActivityPoint = {
  date: string
  value: number
}

export type AdminActivitySeries = Record<AdminActivityMetricId, AdminActivityPoint[] | null>

const ACTIVITY_SOURCES: Array<{
  id: Exclude<AdminActivityMetricId, 'accounts'>
  table: string
  column: string
}> = [
  { id: 'professionals', table: 'profissionais', column: 'created_at' },
  { id: 'companies', table: 'companies', column: 'created_at' },
  { id: 'services', table: 'servicos', column: 'created_at' },
  { id: 'products', table: 'produtos', column: 'created_at' },
  { id: 'vacancies', table: 'vagas', column: 'created_at' },
  { id: 'applications', table: 'candidaturas', column: 'criada_em' },
  { id: 'requests', table: 'pedidos_servico', column: 'criada_em' },
  { id: 'messages', table: 'admin_messages', column: 'created_at' },
  { id: 'alerts', table: 'denuncias', column: 'created_at' },
]

async function readAdminActivityDates(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string,
  column: string,
  startIso: string
): Promise<string[] | null> {
  const dates: string[] = []
  const pageSize = 1000
  let offset = 0

  while (offset < 100000) {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .gte(column, startIso)
      .order(column, { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('[admin-activity] source unavailable:', table, error.code)
      return null
    }

    for (const row of data ?? []) {
      const value = (row as unknown as Record<string, unknown>)[column]
      if (typeof value === 'string' && Number.isFinite(Date.parse(value))) {
        dates.push(value.slice(0, 10))
      }
    }

    if (!data || data.length < pageSize) return dates
    offset += pageSize
  }

  // Não apresentar uma série truncada como se fosse completa.
  console.error('[admin-activity] source exceeded safe pagination limit:', table)
  return null
}

export async function getAdminActivitySeries(): Promise<AdminActivitySeries | null> {
  if (!(await isAdmin())) return null

  const supabase = await createSupabaseServerClient()
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - 89)
  const startIso = start.toISOString()

  const result: AdminActivitySeries = {
    // Contagens protegidas por RPC administrativa: nunca são lidos perfis ou
    // conteúdo de mensagens privadas através da sessão do administrador.
    accounts: null,
    professionals: null,
    companies: null,
    services: null,
    products: null,
    vacancies: null,
    applications: null,
    requests: null,
    messages: null,
    alerts: null,
  }

  const [privateSeries, sources] = await Promise.all([
    supabase.rpc('admin_activity_private_series', {
      p_start_date: start.toISOString().slice(0, 10),
      p_days: 90,
    }),
    Promise.all(
      ACTIVITY_SOURCES.map(async (source) => ({
        id: source.id,
        dates: await readAdminActivityDates(supabase, source.table, source.column, startIso),
      }))
    ),
  ])

  if (privateSeries.error) {
    // Até a migração de RPC estar aplicada, estas duas séries ficam indisponíveis.
    console.error('[admin-activity] protected series unavailable:', privateSeries.error.code)
  } else {
    const privateCounts: Record<'accounts' | 'messages', Map<string, number>> = {
      accounts: new Map(),
      messages: new Map(),
    }

    for (const row of privateSeries.data ?? []) {
      if (row.metric !== 'accounts' && row.metric !== 'messages') continue
      const date = typeof row.activity_date === 'string' ? row.activity_date : ''
      const value = typeof row.value === 'number' ? row.value : Number(row.value)
      if (/^\\d{4}-\\d{2}-\\d{2}$/.test(date) && Number.isFinite(value) && value >= 0) {
        privateCounts[row.metric].set(date, value)
      }
    }

    for (const metric of ['accounts', 'messages'] as const) {
      result[metric] = Array.from({ length: 90 }, (_, day) => {
        const date = new Date(start)
        date.setUTCDate(start.getUTCDate() + day)
        const key = date.toISOString().slice(0, 10)
        return { date: key, value: privateCounts[metric].get(key) ?? 0 }
      })
    }
  }

  for (const source of sources) {
    if (source.dates === null) {
      result[source.id] = null
      continue
    }

    const counts = new Map<string, number>()
    for (const date of source.dates) counts.set(date, (counts.get(date) ?? 0) + 1)

    const points: AdminActivityPoint[] = []
    for (let day = 0; day < 90; day += 1) {
      const date = new Date(start)
      date.setUTCDate(start.getUTCDate() + day)
      const key = date.toISOString().slice(0, 10)
      points.push({ date: key, value: counts.get(key) ?? 0 })
    }
    result[source.id] = points
  }

  return result
}
    ACTIVITY_SOURCES.map(async (source) => ({
      id: source.id,
      dates: await readAdminActivityDates(supabase, source.table, source.column, startIso),
    }))
  )

  for (const source of sources) {
    if (source.dates === null) {
      result[source.id] = null
      continue
    }

    const counts = new Map<string, number>()
    for (const date of source.dates) counts.set(date, (counts.get(date) ?? 0) + 1)

    const points: AdminActivityPoint[] = []
    for (let day = 0; day < 90; day += 1) {
      const date = new Date(start)
      date.setUTCDate(start.getUTCDate() + day)
      const key = date.toISOString().slice(0, 10)
      points.push({ date: key, value: counts.get(key) ?? 0 })
    }
    result[source.id] = points
  }

  return result
}
