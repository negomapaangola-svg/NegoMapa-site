import { createSupabaseServerClient } from './supabase-server'

export async function getSession() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session ?? null
}

export async function getUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  if (!user?.email) return false
  return user.email.includes('@admin')
}