'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth'
import { redirectSeguro } from '@/lib/redirect-seguro'

export async function reativarContaAposLogin(formData: FormData) {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('reactivate_own_account')

  if (error) {
    redirect('/reativar-conta?erro=1')
  }

  revalidatePath('/conta')
  redirect(redirectSeguro(formData.get('redirectTo') as string | null))
}

export async function sairSemReativar() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}