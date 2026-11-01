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

export type EmpresasAdminResult =
  | { success: true; data: EmpresaAdmin[] }
  | { success: false; error: string }

export type ActionResult = {
  success: boolean
  error?: string
}

export async function getAllEmpresasAdmin(): Promise<EmpresasAdminResult> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
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
    return { success: false, error: 'Erro ao carregar empresas' }
  }

  return { success: true, data: data as EmpresaAdmin[] }
}

export async function aprovarEmpresa(empresaId: string): Promise<ActionResult> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('companies')
    .update({ is_approved: true })
    .eq('id', empresaId)
    .select('id')

  if (error) {
    console.error('Erro ao aprovar empresa:', error)
    return { success: false, error: 'Erro ao aprovar empresa. Tente novamente.' }
  }

  if (!data || data.length === 0) {
    return { success: false, error: 'A aprovação falhou ou o utilizador não tem permissão.' }
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

export type EmpresaAdminDetalhe = {
  id: string
  name: string
  slug: string
  sector: string | null
  province: string | null
  city: string | null
  bairro: string | null
  description: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  nif: string | null
  estado_legalizacao: string | null
  is_approved: boolean
  created_at: string
  user_id: string | null
}

export type EmpresaAdminDetalheResult =
  | {
      success: true
      data: EmpresaAdminDetalhe
      logoUrl: string | null
      logoErro: string | null
      comprovativoUrl: string | null
      comprovativoErro: string | null
    }
  | { success: false; error: string; naoEncontrada?: boolean }

const URL_ASSINADO_SEGUNDOS = 300
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Detalhe de uma empresa para o administrador.
 * Os ficheiros privados são devolvidos como URL assinado (válido 5 minutos).
 * O caminho do comprovativo é usado apenas no servidor e não é devolvido.
 */
export async function getEmpresaAdminDetalhe(empresaId: string): Promise<EmpresaAdminDetalheResult> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  if (!UUID_RE.test(empresaId)) {
    return { success: false, error: 'Empresa não encontrada.', naoEncontrada: true }
  }

  const supabase = await createSupabaseServerClient()

  // Função SECURITY DEFINER que verifica admin e devolve só a empresa pedida.
  // Necessária porque authenticated não tem SELECT em nif, logo_url, whatsapp,
  // website e documento_legalizacao_path (migração 20261028).
  const { data, error } = await supabase.rpc('admin_obter_empresa', { p_id: empresaId })

  if (error) {
    console.error('Erro ao buscar detalhe da empresa (admin):', error)
    return { success: false, error: 'Erro ao carregar a empresa.' }
  }

  const linha = Array.isArray(data) ? data[0] : data

  if (!linha) {
    return { success: false, error: 'Empresa não encontrada.', naoEncontrada: true }
  }

  const campos = linha as Record<string, unknown>
  const empresa = pickEmpresaDetalhe(campos)
  const caminhoComprovativo = (campos.documento_legalizacao_path as string | null) ?? null

  const logo = await assinarFicheiro(supabase, 'empresas-logos', empresa.logo_url)
  const comprovativo = await assinarFicheiro(
    supabase,
    'documentos-privados',
    caminhoComprovativo
  )

  return {
    success: true,
    data: empresa,
    logoUrl: logo.url,
    logoErro: logo.erro,
    comprovativoUrl: comprovativo.url,
    comprovativoErro: comprovativo.erro,
  }
}

function pickEmpresaDetalhe(row: Record<string, unknown>): EmpresaAdminDetalhe {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    sector: (row.sector as string | null) ?? null,
    province: (row.province as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    bairro: (row.bairro as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    whatsapp: (row.whatsapp as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    nif: (row.nif as string | null) ?? null,
    estado_legalizacao: (row.estado_legalizacao as string | null) ?? null,
    is_approved: Boolean(row.is_approved),
    created_at: row.created_at as string,
    user_id: (row.user_id as string | null) ?? null,
  }
}

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function assinarFicheiro(
  supabase: SupabaseServer,
  bucket: 'empresas-logos' | 'documentos-privados',
  caminho: string | null
): Promise<{ url: string | null; erro: string | null }> {
  if (!caminho) return { url: null, erro: null }

  // Registos antigos podem guardar um URL completo em vez de um caminho no bucket.
  if (/^https?:\/\//i.test(caminho)) return { url: caminho, erro: null }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(caminho, URL_ASSINADO_SEGUNDOS)

  if (error || !data?.signedUrl) {
    // Sem a mensagem do storage: pode conter o caminho do ficheiro.
    console.error(`Erro ao gerar URL assinado (${bucket}).`)
    return { url: null, erro: 'Não foi possível abrir o ficheiro. Verifique as permissões de leitura do administrador no bucket.' }
  }

  return { url: data.signedUrl, erro: null }
}
