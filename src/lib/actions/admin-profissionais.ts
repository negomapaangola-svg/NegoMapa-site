'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'
import { MOTIVO_MIN_CARACTERES } from '@/lib/profissionais-avaliacao'

export type AvaliacaoProfissionalResult = {
  success: boolean
  error?: string
}

/**
 * Aprova ou rejeita um profissional através da RPC `admin_avaliar_profissional`.
 * A RPC volta a verificar `is_admin()` na base de dados; esta verificação
 * antecipada serve apenas para devolver uma mensagem clara.
 */
export async function avaliarProfissional(
  profissionalId: string,
  estado: 'aprovado' | 'rejeitado',
  motivo?: string
): Promise<AvaliacaoProfissionalResult> {
  if (!(await isAdmin())) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const motivoLimpo = (motivo ?? '').trim()

  if (estado === 'rejeitado' && motivoLimpo.length < MOTIVO_MIN_CARACTERES) {
    return {
      success: false,
      error: `O motivo da rejeição deve ter pelo menos ${MOTIVO_MIN_CARACTERES} caracteres.`,
    }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.rpc('admin_avaliar_profissional', {
    p_id: profissionalId,
    p_estado: estado,
    p_motivo: estado === 'rejeitado' ? motivoLimpo : null,
  })

  if (error) {
    console.error('Erro ao avaliar profissional:', error.message)
    return { success: false, error: 'Não foi possível concluir a avaliação. Tente novamente.' }
  }

  revalidatePath('/admin/profissionais')
  revalidatePath('/profissionais')
  revalidatePath('/editar-perfil')
  return { success: true }
}
