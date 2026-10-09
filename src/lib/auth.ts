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
  if (!user) return false

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('is_admin')

  if (error) {
    console.error('[isAdmin] Error checking admin status:', error.message)
    return false
  }

  return data === true
}