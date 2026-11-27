'use server'

import 'server-only'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'
import { PROVINCIAS } from '@/lib/listas-selecao'

export type DadosEmpresaPendente = {
  nome: string
  slug: string
  setor: string
  provincia: string
  municipio: string
  bairro?: string | null
  latitudeAproximada?: unknown
  longitudeAproximada?: unknown
  descricao?: string | null
  telefone: string
  whatsapp: string
  email: string
  website?: string | null
  logoPath?: string | null
  nif?: string | null
  legalizada: boolean
  documentoPath?: string | null
}

async function validarClienteSemPerfil(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  if (await isAdmin()) return { ok: false as const, message: 'Contas administrativas não podem criar empresas.' }
  const { data: perfil, error: perfilError } = await supabase
    .from('profiles').select('account_type,is_active').eq('id', userId).maybeSingle()
  if (perfilError) {
    console.error('Falha ao validar tipo de conta. Código:', perfilError.code)
    return { ok: false as const, message: 'Não foi possível validar a sua conta. Tente novamente.' }
  }
  if (perfil?.account_type !== 'cliente' || perfil.is_active !== true) {
    return { ok: false as const, message: 'Apenas contas de cliente sem perfil associado podem criar uma empresa.' }
  }
  const [profissional, empresa] = await Promise.all([
    supabase.from('profissionais').select('id').eq('user_id', userId).limit(1).maybeSingle(),
    supabase.from('companies').select('id').eq('user_id', userId).limit(1).maybeSingle(),
  ])
  if (profissional.error || empresa.error) {
    console.error('Falha ao validar perfis associados.', profissional.error?.code, empresa.error?.code)
    return { ok: false as const, message: 'Não foi possível validar os perfis associados. Tente novamente.' }
  }
  if (profissional.data) return { ok: false as const, message: 'Esta conta já tem um perfil profissional associado e não pode criar uma empresa.' }
  if (empresa.data) return { ok: false as const, message: 'Esta conta já tem uma empresa associada.' }
  return { ok: true as const }
}

export async function verificarPodeCriarEmpresa() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { success: false, error: 'Inicie sessão para continuar.', isAdmin: false }
  if (await isAdmin()) return { success: false, error: 'Contas administrativas não podem utilizar o cadastro empresarial.', isAdmin: true }
  const validacao = await validarClienteSemPerfil(supabase, user.id)
  return validacao.ok ? { success: true, isAdmin: false } : { success: false, error: validacao.message, isAdmin: false }
}

export async function criarEmpresaPendente(dados: DadosEmpresaPendente) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'A sessão expirou. Inicie sessão novamente.' }
  if (!dados || typeof dados !== 'object') return { success: false, error: 'Os dados enviados são inválidos.' }

  const validacao = await validarClienteSemPerfil(supabase, user.id)
  if (!validacao.ok) return { success: false, error: validacao.message }

  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : ''
  const slug = typeof dados.slug === 'string' ? dados.slug.trim() : ''
  const setor = typeof dados.setor === 'string' ? dados.setor.trim() : ''
  const provincia = typeof dados.provincia === 'string' ? dados.provincia.trim() : ''
  const municipio = typeof dados.municipio === 'string' ? dados.municipio.trim() : ''
  const telefone = typeof dados.telefone === 'string' ? dados.telefone.trim() : ''
  const whatsapp = typeof dados.whatsapp === 'string' ? dados.whatsapp.trim() : ''
  const latitude = dados.latitudeAproximada == null ? null : Number(dados.latitudeAproximada)
  const longitude = dados.longitudeAproximada == null ? null : Number(dados.longitudeAproximada)
  const email = typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : ''
  if ((latitude === null) !== (longitude === null) ||
      (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
    return { success: false, error: 'A geolocalização aproximada é inválida.' }
  }
  if (nome.length < 2 || nome.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 190 ||
      !setor || setor.length > 100 || !(PROVINCIAS as readonly string[]).includes(provincia) || provincia.length > 80 || !municipio || municipio.length > 100 ||
      (!telefone && !whatsapp) ||
      (telefone && (telefone.length < 5 || telefone.length > 32)) ||
      (whatsapp && (whatsapp.length < 5 || whatsapp.length > 32)) ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { success: false, error: 'Verifique os campos obrigatórios do registo.' }
  }
  if ((dados.bairro ?? '').length > 120 || (dados.descricao ?? '').length > 2000 || (dados.website ?? '').length > 500 ||
      (dados.nif ?? '').length > 40) return { success: false, error: 'Um ou mais campos excedem o limite permitido.' }

  const { error } = await supabase.rpc('create_company_profile_and_request', {
    p_profile_data: {
      name: nome,
      slug,
      sector: setor,
      province: provincia,
      city: municipio,
      bairro: dados.bairro?.trim() || null,
      latitude_aproximada: latitude === null ? null : Math.round(latitude * 100) / 100,
      longitude_aproximada: longitude === null ? null : Math.round(longitude * 100) / 100,
      description: dados.descricao?.trim() || null,
      phone: telefone || null,
      whatsapp: whatsapp || null,
      email,
      website: dados.website?.trim() || null,
      logo_url: dados.logoPath || null,
      nif: dados.legalizada ? (dados.nif?.trim() || null) : null,
      estado_legalizacao: dados.legalizada ? 'legalizada' : null,
      documento_legalizacao_path: dados.legalizada ? (dados.documentoPath || null) : null,
    },
  })
  if (error) {
    if (error.code === '23505') return { success: false, error: 'Já existe um registo ou pedido associado a esta conta.' }
    console.error('Erro ao criar empresa e pedido de mudança de tipo. Código:', error.code)
    return { success: false, error: 'Não foi possível guardar a empresa e o pedido. Verifique os dados e tente novamente.' }
  }

  revalidatePath('/perfil')
  revalidatePath('/cadastrar-empresa')
  revalidatePath('/conta/configuracoes')
  return { success: true }
}

export async function converterContaCliente(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login?erro=conversao')
  }

  const targetRole = typeof formData.get('target_role') === 'string' ? String(formData.get('target_role')) : ''
  const displayName = typeof formData.get('nome') === 'string' ? String(formData.get('nome')).trim() : ''

  if (targetRole !== 'profissional' && targetRole !== 'empresa') {
    redirect('/conta/configuracoes?erro=conversao')
  }

  if (displayName.length < 2 || displayName.length > 160) {
    redirect('/conta/configuracoes?erro=conversao')
  }

  const { data, error } = await supabase.rpc('request_account_type_change', {
    p_requested_type: targetRole,
    p_display_name: displayName,
  })

  if (error || !data) {
    console.error('Erro ao criar pedido de mudança de tipo de conta. Código:', error?.code)
    redirect('/conta/configuracoes?erro=pedido_tipo')
  }

  revalidatePath('/conta')
  revalidatePath('/conta/configuracoes')
  revalidatePath('/admin')
  redirect('/conta/configuracoes?pedido_tipo=criado')
}
