'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type PedidoMudancaTipoConta = {
  id: string
  user_id: string
  requested_account_type: 'profissional' | 'empresa'
  display_name: string
  requested_at: string
}

export async function listarPedidosMudancaTipoConta(): Promise<{
  ok: boolean
  pedidos: PedidoMudancaTipoConta[]
  message?: string
}> {
  if (!(await isAdmin())) {
    return { ok: false, pedidos: [], message: 'Acesso reservado à administração.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('admin_list_account_type_change_requests')
  if (error) {
    console.error('Erro ao listar pedidos de mudança de tipo. Código:', error.code)
    return { ok: false, pedidos: [], message: 'Não foi possível carregar os pedidos.' }
  }

  return { ok: true, pedidos: (data ?? []) as PedidoMudancaTipoConta[] }
}

export async function avaliarPedidoMudancaTipoConta(
  requestId: string,
  decisao: 'approve' | 'reject',
  motivo?: string,
): Promise<{ ok: boolean; message: string }> {
  if (!(await isAdmin())) {
    return { ok: false, message: 'Acesso reservado à administração.' }
  }
  if (!UUID.test(requestId) || (decisao !== 'approve' && decisao !== 'reject')) {
    return { ok: false, message: 'Pedido ou decisão inválidos.' }
  }

  const reason = typeof motivo === 'string' ? motivo.trim() : ''
  if (decisao === 'reject' && (reason.length < 10 || reason.length > 1000)) {
    return { ok: false, message: 'Indique um motivo de rejeição entre 10 e 1000 caracteres.' }
  }
  if (decisao === 'approve' && reason.length > 1000) {
    return { ok: false, message: 'O motivo não pode exceder 1000 caracteres.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('admin_review_account_type_change', {
    p_request_id: requestId,
    p_decision: decisao,
    p_reason: reason || null,
  })

  if (error || !data) {
    console.error('Erro ao avaliar pedido de mudança de tipo. Código:', error?.code)
    return { ok: false, message: 'Não foi possível avaliar o pedido. Actualize a lista e tente novamente.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/pedidos-tipo-conta')
  revalidatePath('/conta')
  revalidatePath('/conta/configuracoes')
  revalidatePath('/perfil')

  return {
    ok: true,
    message: decisao === 'approve'
      ? 'Pedido aprovado. O tipo de conta foi actualizado e o perfil continua sujeito à aprovação própria.'
      : 'Pedido rejeitado. A conta mantém o tipo cliente.',
  }
}
