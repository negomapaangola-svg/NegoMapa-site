'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'

export type AdminEliminacaoResult = {
  success: boolean
  error?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIPOS_VALIDOS = ['empresa', 'servico', 'produto', 'vaga'] as const

type TipoConteudo = (typeof TIPOS_VALIDOS)[number]

export async function eliminarConteudoAdmin(
  tipo: TipoConteudo,
  id: string
): Promise<AdminEliminacaoResult> {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return { success: false, error: 'Tipo de conteúdo inválido.' }
  }

  if (!UUID_RE.test(id)) {
    return { success: false, error: 'Identificador inválido.' }
  }

  if (!(await isAdmin())) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('admin_eliminar_conteudo', {
    p_entity_type: tipo,
    p_entity_id: id,
  })

  if (error) {
    console.error('Erro ao eliminar conteúdo (admin):', error)

    if (error.message.includes('ACESSO_NEGADO')) {
      return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
    }
    if (error.message.includes('REGISTO_NAO_ENCONTRADO')) {
      return { success: false, error: 'Registo não encontrado ou já eliminado.' }
    }

    return { success: false, error: 'Não foi possível eliminar o registo. A operação foi cancelada.' }
  }

  if (tipo === 'empresa') {
    revalidatePath('/admin/empresas')
    revalidatePath('/empresas')
    revalidatePath('/vagas')
    revalidatePath('/servicos')
  }

  if (tipo === 'servico') {
    revalidatePath('/admin/servicos')
    revalidatePath('/servicos')
  }

  if (tipo === 'vaga') {
    revalidatePath('/admin/vagas')
    revalidatePath('/vagas')
  }

  if (tipo === 'produto') {
    revalidatePath('/admin/conteudos')
    revalidatePath('/produto')
  }

  return { success: true }
}
