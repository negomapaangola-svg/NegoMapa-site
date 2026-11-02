'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/auth'
import { SUSPENSAO_DISPONIVEL } from '@/lib/admin-profissionais-config'

// Campos devolvidos por admin_listar_profissionais() (sem whatsapp: não é mostrado nesta página).
// categoria só existe depois da migração 20261102130000; antes disso chega undefined.
export type ProfissionalAdmin = {
  id: string
  nome: string
  estado: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso' | string
  provincia: string | null
  municipio: string | null
  slug: string | null
  created_at: string
  motivo_rejeicao: string | null
  avaliado_em: string | null
  categoria?: string | null
}

export type ProfissionaisAdminResult =
  | { success: true; data: ProfissionalAdmin[] }
  | { success: false; error: string }

export type AvaliacaoProfissionalResult = {
  success: boolean
  error?: string
}

const ESTADOS_AVALIACAO = ['pendente', 'aprovado', 'rejeitado', 'suspenso'] as const
type EstadoAvaliacao = (typeof ESTADOS_AVALIACAO)[number]

export async function getProfissionaisAdmin(): Promise<ProfissionaisAdminResult> {
  if (!(await isAdmin())) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('admin_listar_profissionais')

  if (error) {
    console.error('Erro ao listar profissionais (admin). Código:', error.code)
    return { success: false, error: 'Erro ao carregar profissionais.' }
  }

  return { success: true, data: (data ?? []) as ProfissionalAdmin[] }
}

export async function avaliarProfissional(
  profissionalId: string,
  estado: EstadoAvaliacao,
  motivo?: string
): Promise<AvaliacaoProfissionalResult> {
  if (!(await isAdmin())) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  if (!ESTADOS_AVALIACAO.includes(estado)) {
    return { success: false, error: 'Estado inválido.' }
  }

  if (estado === 'suspenso' && !SUSPENSAO_DISPONIVEL) {
    return { success: false, error: 'A suspensão ainda não está disponível.' }
  }

  if (estado === 'rejeitado' && (!motivo || motivo.trim().length < 10)) {
    return { success: false, error: 'O motivo da rejeição é obrigatório (mínimo 10 caracteres).' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('admin_avaliar_profissional', {
    p_id: profissionalId,
    p_estado: estado,
    p_motivo: estado === 'rejeitado' ? motivo!.trim() : null,
  })

  if (error) {
    console.error('Erro ao avaliar profissional (admin). Código:', error.code)
    return { success: false, error: 'Não foi possível alterar o estado do profissional. Tente novamente.' }
  }

  revalidatePath('/admin/profissionais')
  return { success: true }
}
