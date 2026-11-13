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

export type ProfissionalAdminDetalhe = ProfissionalAdmin & {
  whatsapp: string | null
  descricao: string | null
}

export type ProfissionaisAdminResult =
  | { success: true; data: ProfissionalAdmin[] }
  | { success: false; error: string }

export type ProfissionalAdminDetalheResult =
  | { success: true; data: ProfissionalAdminDetalhe }
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

/**
 * Lê apenas os campos adicionais necessários à página de detalhe.
 * A leitura directa respeita as políticas RLS existentes; não usa service role
 * nem tenta contornar uma eventual recusa de acesso.
 */
export async function getProfissionalAdminDetalhe(
  profissionalId: string
): Promise<ProfissionalAdminDetalheResult> {
  if (!(await isAdmin())) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profissionalId)) {
    return { success: false, error: 'Identificador de profissional inválido.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data: lista, error: erroLista } = await supabase.rpc('admin_listar_profissionais')

  if (erroLista) {
    console.error('Erro ao localizar profissional para detalhe. Código:', erroLista.code)
    return { success: false, error: 'Não foi possível carregar os dados administrativos do profissional.' }
  }

  const profissional = ((lista ?? []) as ProfissionalAdmin[]).find((item) => item.id === profissionalId)
  if (!profissional) {
    return { success: false, error: 'Profissional não encontrado ou sem acesso de leitura pela política RLS.' }
  }

  const { data: detalhe, error: erroDetalhe } = await supabase
    .from('profissionais')
    .select('whatsapp, bio')
    .eq('id', profissionalId)
    .maybeSingle()

  if (erroDetalhe) {
    console.error('Erro ao ler detalhe do profissional (admin). Código:', erroDetalhe.code)
    return {
      success: false,
      error: erroDetalhe.code === '42501'
        ? 'A política RLS não permite a leitura dos dados adicionais deste profissional. Nenhuma protecção foi contornada.'
        : 'Não foi possível ler os dados adicionais do profissional. Verifique as permissões RLS.',
    }
  }

  if (!detalhe) {
    return {
      success: false,
      error: 'Não foi possível obter os dados adicionais do profissional. O registo pode estar indisponível ou a política RLS pode impedir a leitura.',
    }
  }

  return {
    success: true,
    data: {
      ...profissional,
      whatsapp: detalhe.whatsapp ?? null,
      descricao: detalhe.bio ?? null,
    },
  }
}

export async function avaliarProfissional(
  profissionalId: string,
  estado: EstadoAvaliacao,
  motivo?: string
): Promise<AvaliacaoProfissionalResult> {
  try {
    if (!(await isAdmin())) {
      return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profissionalId)) {
      return { success: false, error: 'Identificador de profissional inválido.' }
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
    revalidatePath(`/admin/profissionais/${profissionalId}`)
    revalidatePath('/profissionais')
    return { success: true }
  } catch (error) {
    console.error(
      'Erro inesperado ao avaliar profissional (admin):',
      error instanceof Error ? error.message : 'Erro desconhecido'
    )
    return {
      success: false,
      error: 'Não foi possível comunicar com o servidor. Verifique a ligação e tente novamente.',
    }
  }
}
