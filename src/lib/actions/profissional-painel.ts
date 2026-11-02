'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export type PerfilProfissionalProprio = {
  id: string
  estado: string
}

/**
 * Devolve o perfil de profissional do utilizador autenticado, ou null.
 * A RLS de profissionais permite ao próprio dono ler a sua linha, em qualquer estado.
 */
export async function obterPerfilProfissionalDoUtilizador(): Promise<PerfilProfissionalProprio | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profissionais')
    .select('id, estado')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Erro ao obter perfil de profissional. Código:', error.code)
    return null
  }

  return (data ?? null) as PerfilProfissionalProprio | null
}
