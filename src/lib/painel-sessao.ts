import { createSupabaseServerClient } from '@/lib/supabase-server'
import { tipoDoUtilizador, type TipoPainel } from '@/lib/painel-acesso'

export type SessaoPainel = {
  userId: string
  tipo: TipoPainel | null
}

/**
 * Lê a sessão e o tipo de painel no servidor.
 * Devolve null se não houver sessão. O tipo é null quando não há um tipo único.
 * Só lê as linhas do próprio utilizador (RLS: user_id = auth.uid()).
 */
export async function obterSessaoPainel(): Promise<SessaoPainel | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [empresa, profissional] = await Promise.all([
    supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  return {
    userId: user.id,
    tipo: tipoDoUtilizador(Boolean(empresa.data), Boolean(profissional.data)),
  }
}
