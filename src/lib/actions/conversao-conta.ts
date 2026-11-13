'use server'

import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type DadosEmpresaPendente = {
  nome: string
  slug: string
  setor: string
  provincia: string
  municipio: string
  bairro?: string | null
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
  const { data: perfil, error: perfilError } = await supabase
    .from('profiles').select('account_type').eq('id', userId).maybeSingle()
  if (perfilError) {
    console.error('Falha ao validar tipo de conta. Código:', perfilError.code)
    return { ok: false as const, message: 'Não foi possível validar a sua conta. Tente novamente.' }
  }
  if (perfil?.account_type !== 'cliente') {
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
  if (error || !user) return { success: false, error: 'Inicie sessão para continuar.' }
  const validacao = await validarClienteSemPerfil(supabase, user.id)
  return validacao.ok ? { success: true } : { success: false, error: validacao.message }
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
  const email = typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : ''
  if (nome.length < 2 || nome.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 190 ||
      !setor || setor.length > 100 || !provincia || provincia.length > 80 || !municipio || municipio.length > 100 ||
      telefone.length < 5 || telefone.length > 32 || whatsapp.length < 5 || whatsapp.length > 32 ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { success: false, error: 'Verifique os campos obrigatórios do registo.' }
  }
  if ((dados.bairro ?? '').length > 120 || (dados.descricao ?? '').length > 2000 || (dados.website ?? '').length > 500 ||
      (dados.nif ?? '').length > 40) return { success: false, error: 'Um ou mais campos excedem o limite permitido.' }

  const { error } = await supabase.from('companies').insert({
    user_id: user.id,
    name: nome,
    slug,
    sector: setor,
    province: provincia,
    city: municipio,
    bairro: dados.bairro?.trim() || null,
    description: dados.descricao?.trim() || null,
    phone: telefone,
    whatsapp,
    email,
    website: dados.website?.trim() || null,
    logo_url: dados.logoPath || null,
    nif: dados.legalizada ? (dados.nif?.trim() || null) : null,
    estado_legalizacao: dados.legalizada ? 'legalizada' : null,
    documento_legalizacao_path: dados.legalizada ? (dados.documentoPath || null) : null,
    is_approved: false,
  })
  if (error) {
    if (error.code === '23505') return { success: false, error: 'Já existe um registo semelhante ou uma empresa associada a esta conta.' }
    console.error('Erro ao criar empresa pendente. Código:', error.code)
    return { success: false, error: 'Não foi possível registar a empresa. Verifique os dados e tente novamente.' }
  }
  revalidatePath('/perfil')
  revalidatePath('/cadastrar-empresa')
  return { success: true }
}
