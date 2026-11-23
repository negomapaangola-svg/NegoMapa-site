'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { redirectSeguro } from '@/lib/redirect-seguro'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = redirectSeguro(formData.get('redirectTo') as string | null)

  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios' }
  }

  const cleanEmail = email.trim().toLowerCase()

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  })

  if (error) {
    return {
      error: error.code === 'user_banned'
        ? 'Esta conta está suspensa. Contacte a administração da plataforma.'
        : error.message,
    }
  }

  if (!data.session || !data.user) {
    return { error: 'Sessão não criada. Tente novamente.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', data.user.id)
    .maybeSingle()

  const status = profile?.account_status ?? 'active'

  if (status === 'deactivated') {
    redirect(`/reativar-conta?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  if (status === 'suspended') {
    await supabase.auth.signOut({ scope: 'local' })
    return { error: 'Esta conta está suspensa. Contacte a administração da plataforma.' }
  }

  if (status === 'pending_deletion') {
    await supabase.auth.signOut({ scope: 'local' })
    return { error: 'Esta conta tem uma eliminação pendente. Entre nas configurações para confirmar ou cancelar.' }
  }

  if (status === 'deleted') {
    await supabase.auth.signOut({ scope: 'local' })
    return { error: 'Esta conta foi eliminada e não pode ser restaurada.' }
  }

  if (profileError && !(profileError.code === '42703' || profileError.code === 'PGRST204')) {
    await supabase.auth.signOut({ scope: 'local' })
    return { error: 'Não foi possível confirmar o estado da conta. Tente novamente.' }
  }

  const adminCheck = await isAdmin()
  if (adminCheck && redirectTo === '/') {
    redirect('/admin')
  }

  redirect(redirectTo)
}