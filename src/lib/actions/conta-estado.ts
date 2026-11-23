'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth'

async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

async function signOutAndRedirect(destination: string) {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect(destination)
}

export async function desativarContaPropria() {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('deactivate_own_account')
  if (error) redirect('/conta/configuracoes?erro=estado')
  revalidatePath('/conta')
  await signOutAndRedirect('/login?conta=desativada')
}

export async function reativarContaPropria() {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('reactivate_own_account')
  if (error) redirect('/login?erro=reativacao')
  revalidatePath('/conta')
  redirect('/conta?reativada=1')
}

export async function suspenderContaPropria(formData: FormData) {
  const user = await requireUser()
  const motivo = String(formData.get('motivo') ?? '').trim()
  if (motivo.length < 10) redirect('/conta/configuracoes?erro=motivo')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('suspend_own_account', { p_reason: motivo })
  if (error) redirect('/conta/configuracoes?erro=estado')
  revalidatePath('/conta')
  await signOutAndRedirect('/login?conta=suspensa')
}

export async function restaurarContaPropria() {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('restore_own_account')
  if (error) redirect('/conta/configuracoes?erro=estado')
  revalidatePath('/conta')
  redirect('/conta?restaurada=1')
}

export async function pedirEliminacaoPropria() {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('request_delete_own_account')
  if (error) redirect('/conta/configuracoes?erro=estado')
  revalidatePath('/conta/configuracoes')
  redirect('/conta/configuracoes?pedido=1')
}

export async function confirmarEliminacaoPropria(formData: FormData) {
  const user = await requireUser()
  const confirmacao = String(formData.get('confirmacao') ?? '').trim()
  if (confirmacao !== 'ELIMINAR') redirect('/conta/configuracoes?erro=confirmacao')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('confirm_delete_own_account', { p_confirmation: confirmacao })
  if (error) redirect('/conta/configuracoes?erro=estado')
  revalidatePath('/')
  await signOutAndRedirect('/?conta=eliminada')
}