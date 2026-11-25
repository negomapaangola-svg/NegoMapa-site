'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

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
  await requireUser()
  const confirmacao = String(formData.get('confirmacao') ?? '')
  if (confirmacao !== 'ELIMINAR') redirect('/conta/configuracoes?erro=confirmacao')

  const supabase = await createSupabaseServerClient()
  const { data: manifest, error: manifestError } = await supabase.rpc('get_own_account_deletion_storage_manifest')
  if (manifestError) {
    console.error('Erro ao obter ficheiros associados à conta:', manifestError)
    redirect('/conta/configuracoes?erro=storage')
  }

  const objects = (manifest as { objects?: Array<{ bucket_id: string; name: string }> } | null)?.objects
  if (!Array.isArray(objects)) redirect('/conta/configuracoes?erro=storage')

  // A Storage API remove os ficheiros físicos; nunca se apagam registos em storage.objects por SQL.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const storageSecret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !storageSecret) {
    console.error('Falta configurar SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY para a limpeza do Storage.')
    redirect('/conta/configuracoes?erro=storage')
  }

  const storageAdmin = createClient(supabaseUrl, storageSecret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
  const byBucket = new Map<string, Set<string>>()
  for (const object of objects) {
    if (!object || typeof object.bucket_id !== 'string' || typeof object.name !== 'string') {
      redirect('/conta/configuracoes?erro=storage')
    }
    const paths = byBucket.get(object.bucket_id) ?? new Set<string>()
    paths.add(object.name)
    byBucket.set(object.bucket_id, paths)
  }

  for (const [bucket, pathsSet] of byBucket) {
    const paths = [...pathsSet]
    for (let offset = 0; offset < paths.length; offset += 1000) {
      const { error } = await storageAdmin.storage.from(bucket).remove(paths.slice(offset, offset + 1000))
      if (error) {
        console.error('Erro ao remover ficheiros do Storage:', { bucket, error })
        redirect('/conta/configuracoes?erro=storage')
      }
    }
  }

  // A RPC volta a verificar que não restam ficheiros antes da eliminação relacional transaccional.
  const { error } = await supabase.rpc('confirm_delete_own_account', { p_confirmation: confirmacao })
  if (error) {
    console.error('Erro ao eliminar permanentemente a conta:', error)
    redirect('/conta/configuracoes?erro=estado')
  }

  revalidatePath('/')
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/?conta=eliminada')
}