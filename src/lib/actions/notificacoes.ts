'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export type Notificacao = {
  id: string
  tipo: string
  titulo: string
  corpo: string
  canal: 'email' | 'plataforma' | 'whatsapp' | string
  referencia_id: string | null
  lida: boolean
  criada_em: string
}

type Resultado<T> = { success: true; data: T } | { success: false; error: string }

export async function listarNotificacoes(): Promise<Resultado<Notificacao[]>> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  // A RLS devolve apenas as notificações do próprio utilizador.
  const { data, error } = await supabase
    .from('notificacoes')
    .select('id, tipo, titulo, corpo, canal, referencia_id, lida, criada_em')
    .order('criada_em', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Erro ao listar notificações. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar as notificações.' }
  }

  return { success: true, data: (data ?? []) as Notificacao[] }
}

export async function marcarNotificacaoLida(notificacaoId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  // Só a coluna lida tem GRANT de UPDATE; a RLS limita à própria notificação.
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('id', notificacaoId)

  if (error) {
    console.error('Erro ao marcar notificação. Código:', error.code)
    return { success: false, error: 'Não foi possível marcar a notificação.' }
  }

  revalidatePath('/notificacoes')
  return { success: true }
}

export async function marcarTodasLidas(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('lida', false)

  if (error) {
    console.error('Erro ao marcar notificações. Código:', error.code)
    return { success: false, error: 'Não foi possível marcar as notificações.' }
  }

  revalidatePath('/notificacoes')
  return { success: true }
}
