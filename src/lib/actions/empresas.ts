'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/auth'

export type EmpresaAdmin = {
  id: string
  name: string
  sector?: string | null
  province?: string | null
  city?: string | null
  email?: string | null
  phone?: string | null
  is_approved: boolean
  created_at: string
  user_id: string
}

export type ActionResult = {
  success: boolean
  error?: string
}

export async function getAllEmpresasAdmin(): Promise<EmpresaAdmin[]> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return []
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      sector,
      province,
      city,
      email,
      phone,
      is_approved,
      created_at,
      user_id
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar empresas (admin):', error)
    return []
  }

  return data as EmpresaAdmin[]
}

export async function aprovarEmpresa(empresaId: string): Promise<ActionResult> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('companies')
    .update({ is_approved: true })
    .eq('id', empresaId)

  if (error) {
    console.error('Erro ao aprovar empresa:', error)
    return { success: false, error: 'Erro ao aprovar empresa. Tente novamente.' }
  }

  revalidatePath('/admin/empresas')
  return { success: true }
}

export async function rejeitarEmpresa(empresaId: string): Promise<ActionResult> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', empresaId)

  if (error) {
    console.error('Erro ao rejeitar empresa:', error)
    return { success: false, error: 'Erro ao rejeitar empresa. Tente novamente.' }
  }

  revalidatePath('/admin/empresas')
  return { success: true }
}

export async function suspenderEmpresa(empresaId: string): Promise<ActionResult> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const supabase = await createSupabaseServerClient()

  const { data: empresa, error: fetchError } = await supabase
    .from('companies')
    .select('is_approved')
    .eq('id', empresaId)
    .single()

  if (fetchError || !empresa) {
    return { success: false, error: 'Empresa não encontrada' }
  }

  const { error } = await supabase
    .from('companies')
    .update({ is_approved: false })
    .eq('id', empresaId)

  if (error) {
    console.error('Erro ao suspender empresa:', error)
    return { success: false, error: 'Erro ao suspender empresa. Tente novamente.' }
  }

  revalidatePath('/admin/empresas')
  return { success: true }
}