import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session ?? null
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  if (!session?.user?.email) return false
  return session.user.email.includes('@admin')
}