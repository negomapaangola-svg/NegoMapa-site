'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'

function isValidRedirect(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/api/')
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rawRedirectTo = formData.get('redirectTo') as string

  const redirectTo = rawRedirectTo && isValidRedirect(rawRedirectTo) ? rawRedirectTo : '/'

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

  if (!data.session) {
    return { error: 'Sessão não criada. Tente novamente.' }
  }

  const adminCheck = await isAdmin()
  if (adminCheck && redirectTo === '/') {
    redirect('/admin')
  }

  redirect(redirectTo)
}