'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export type PreferenciasNotificacao = {
  plataforma: boolean
  email: boolean
  whatsapp: boolean
}

type Resultado<T> = { success: true; data: T } | { success: false; error: string }

const PREFERENCIAS_PADRAO: PreferenciasNotificacao = {
  plataforma: true,
  email: false,
  whatsapp: false,
}

export async function obterPreferenciasNotificacao(): Promise<Resultado<PreferenciasNotificacao>> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }
  }

  const { data, error } = await supabase
    .from('preferencias_notificacao')
    .select('plataforma, email, whatsapp')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Erro ao obter preferências de notificação. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar as preferências.' }
  }

  if (!data) {
    return { success: true, data: PREFERENCIAS_PADRAO }
  }

  return {
    success: true,
    data: {
      plataforma: Boolean(data.plataforma),
      email: Boolean(data.email),
      whatsapp: Boolean(data.whatsapp),
    },
  }
}

export async function guardarPreferenciasNotificacao(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/preferencias-notificacoes')
  }

  const preferencias = {
    user_id: user.id,
    plataforma: formData.get('plataforma') === 'on',
    email: formData.get('email') === 'on',
    whatsapp: formData.get('whatsapp') === 'on',
    atualizada_em: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('preferencias_notificacao')
    .upsert(preferencias, { onConflict: 'user_id' })

  if (error) {
    console.error('Erro ao guardar preferências de notificação. Código:', error.code)
    redirect('/preferencias-notificacoes?erro=1')
  }

  revalidatePath('/preferencias-notificacoes')
  redirect('/preferencias-notificacoes?salvo=1')
}
