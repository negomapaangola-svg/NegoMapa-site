'use server'

import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ACCOUNT_TYPES = ['cliente', 'profissional', 'empresa'] as const

export type DeletionAccountType = (typeof ACCOUNT_TYPES)[number]
export type DeletionCandidate = {
  account_id: string
  display_name: string
  account_type: DeletionAccountType
  current_status: string
  is_active: boolean
  dependencies: Record<string, number>
}
export type DeletionAuditEntry = {
  id: string
  admin_id: string
  account_id: string
  account_type: DeletionAccountType
  reason: string
  occurred_at: string
  previous_state: Record<string, unknown>
  new_state: Record<string, unknown>
  dependency_counts: Record<string, number>
  auth_ban_status: 'pending' | 'banned' | 'failed'
}

export type AccountDeletionData = {
  success: boolean
  error?: string
  accounts: DeletionCandidate[]
  audit: DeletionAuditEntry[]
}

export async function getAdminAccountDeletionData(): Promise<AccountDeletionData> {
  if (!(await isAdmin())) {
    return { success: false, error: 'Acesso negado. É necessária uma sessão de administrador.', accounts: [], audit: [] }
  }

  const supabase = await createSupabaseServerClient()
  const [accountsResult, auditResult] = await Promise.all([
    supabase.rpc('admin_list_account_deletion_candidates'),
    supabase.from('admin_account_deletion_audit')
      .select('id,admin_id,account_id,account_type,reason,occurred_at,previous_state,new_state,dependency_counts,auth_ban_status')
      .order('occurred_at', { ascending: false })
      .limit(50),
  ])

  if (accountsResult.error) {
    console.error('[admin-account-deletion] list failed:', accountsResult.error.code)
    return {
      success: false,
      error: 'A funcionalidade ainda não está disponível neste ambiente. A migração de desactivação segura tem de ser aplicada primeiro num ambiente de teste.',
      accounts: [],
      audit: [],
    }
  }

  if (auditResult.error) {
    console.error('[admin-account-deletion] audit list failed:', auditResult.error.code)
    return {
      success: false,
      error: 'Não foi possível consultar a auditoria. A lista de contas foi ocultada por segurança.',
      accounts: [],
      audit: [],
    }
  }

  return {
    success: true,
    accounts: (accountsResult.data ?? []) as DeletionCandidate[],
    audit: (auditResult.data ?? []) as DeletionAuditEntry[],
  }
}

export async function eliminarContaAdmin(
  accountId: string,
  accountType: DeletionAccountType,
  reason: string,
  confirmation: string
): Promise<{ success: boolean; error?: string; warning?: string }> {
  if (!(await isAdmin())) return { success: false, error: 'Acesso negado. É necessária uma sessão de administrador.' }
  if (!UUID_RE.test(accountId)) return { success: false, error: 'Identificador de conta inválido.' }
  if (!ACCOUNT_TYPES.includes(accountType)) return { success: false, error: 'Tipo de conta inválido.' }
  if (typeof reason !== 'string' || reason.trim().length < 10 || reason.trim().length > 1000) {
    return { success: false, error: 'O motivo é obrigatório e deve ter entre 10 e 1000 caracteres.' }
  }
  if (confirmation !== 'ELIMINAR') return { success: false, error: 'Escreva ELIMINAR para confirmar explicitamente.' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'A sessão expirou. Inicie sessão novamente.' }
  if (user.id === accountId) return { success: false, error: 'Não é permitido eliminar a própria conta.' }

  const { data, error } = await supabase.rpc('admin_deactivate_account', {
    p_account_id: accountId,
    p_account_type: accountType,
    p_reason: reason.trim(),
    p_confirm: true,
  })

  if (error || !data?.audit_id) {
    console.error('[admin-account-deletion] deactivation failed:', error?.code ?? 'missing-audit-id')
    return { success: false, error: 'Não foi possível desactivar a conta. Nenhuma eliminação física foi executada.' }
  }

  const auditId = String(data.audit_id)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let authBanStatus: 'banned' | 'failed' = 'failed'
  let warning: string | undefined

  if (supabaseUrl && serviceRoleKey) {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: banError } = await adminClient.auth.admin.updateUserById(accountId, {
      ban_duration: '876000h',
    })
    if (banError) {
      console.error('[admin-account-deletion] auth ban failed:', banError.message)
      warning = 'A conta foi desactivada e auditada na plataforma, mas o bloqueio adicional de autenticação não foi confirmado. O acesso normal à aplicação continua bloqueado pelo estado da conta.'
    } else {
      authBanStatus = 'banned'
    }
  } else {
    warning = 'A conta foi desactivada e auditada na plataforma. Falta configurar a chave de serviço apenas no servidor para bloquear também novas autenticações directamente no Supabase.'
  }

  const { error: auditStatusError } = await supabase.rpc('admin_update_account_deletion_auth_status', {
    p_audit_id: auditId,
    p_status: authBanStatus,
  })
  if (auditStatusError) {
    console.error('[admin-account-deletion] audit auth status update failed:', auditStatusError.code)
    warning = warning
      ? `${warning} O estado do bloqueio externo também não pôde ser actualizado na auditoria.`
      : 'A conta foi desactivada e auditada, mas não foi possível actualizar o estado do bloqueio externo no registo de auditoria.'
  }

  revalidatePath('/admin/contas')
  revalidatePath('/admin')
  revalidatePath('/admin/profissionais')
  revalidatePath('/admin/empresas')
  revalidatePath('/profissionais')
  revalidatePath('/empresas')
  revalidatePath('/vagas')
  revalidatePath('/descobrir')

  return { success: true, warning }
}
