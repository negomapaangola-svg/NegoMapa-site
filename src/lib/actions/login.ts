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
    return { error: error.message }
  }

  if (!data.session || !data.user) {
    return { error: 'Sessão não criada. Tente novamente.' }
  }

  // A coluna só existe depois da migração de desactivação segura.
  // Em ambientes ainda sem migração, mantém-se o fluxo de autenticação anterior.
  const { data: profileStatus, error: profileStatusError } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profileStatusError && profileStatus?.is_active === false) {
    await supabase.auth.signOut({ scope: 'local' })
    return { error: 'Esta conta está desactivada. Contacte a administração da plataforma.' }
  }

  if (profileStatusError && profileStatusError.code !== '42703') {
    await supabase.auth.signOut({ scope: 'local' })
    return { error: 'Não foi possível confirmar o estado da conta. Tente novamente.' }
  }

  const adminCheck = await isAdmin()
  if (adminCheck && redirectTo === '/') {
    redirect('/admin')
  }

  redirect(redirectTo)
}
