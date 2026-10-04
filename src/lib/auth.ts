import { createSupabaseServerClient } from './supabase-server'

export async function getSession() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session ?? null
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  if (!session?.user?.email) return false
  return session.user.email.includes('@admin')
}