'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { obterContextoUtilizador, podePublicarVaga } from '@/lib/permissoes'
import { isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type VagaFormData = {
  titulo: string
  descricao: string
  requisitos: string
  categoria: string
  provincia: string
  municipio: string
  tipo_contrato: string
  salario: string
  whatsapp: string
}

export type ActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function validateWhatsApp(whatsapp: string): boolean {
  const clean = whatsapp.replace(/[\s+\-()]/g, '')
  const angolaPhoneRegex = /^(?:\+?244|0)?[92]\d{8}$/
  return angolaPhoneRegex.test(clean)
}

function validateVaga(data: VagaFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.titulo.trim()) errors.titulo = 'Título é obrigatório'
  if (!data.descricao.trim()) errors.descricao = 'Descrição é obrigatória'
  if (!data.categoria.trim()) errors.categoria = 'Categoria é obrigatória'
  if (!data.provincia.trim()) errors.provincia = 'Província é obrigatória'
  if (!data.whatsapp.trim()) errors.whatsapp = 'WhatsApp é obrigatório'
  if (data.whatsapp.trim() && !validateWhatsApp(data.whatsapp)) {
    errors.whatsapp = 'WhatsApp deve ser um número válido de Angola (ex: +244 9XX XXX XXX)'
  }
  return errors
}

async function criarNotificacao(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  tipo: string,
  titulo: string,
  corpo: string,
  referenciaId: string | null
): Promise<void> {
  const { data: preferencias } = await supabase
    .from('preferencias_notificacao')
    .select('plataforma')
    .eq('user_id', userId)
    .maybeSingle()

  if (preferencias && !preferencias.plataforma) {
    return
  }

  await supabase.from('notificacoes').insert({
    user_id: userId,
    tipo,
    titulo,
    corpo,
    canal: 'plataforma',
    referencia_id: referenciaId,
  })
}

export async function createVaga(formData: VagaFormData, companyId: string): Promise<ActionResult> {
  if (await isAdmin()) return { success: false, error: 'Contas administrativas não podem publicar vagas.' }
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const { data: perfilConta } = await supabase.from('profiles').select('is_active').eq('id', user.id).maybeSingle()
  if (perfilConta?.is_active !== true) return { success: false, error: 'A conta não está activa.' }

  if (!podePublicarVaga(await obterContextoUtilizador())) {
    return { success: false, error: 'Apenas empresas aprovadas podem publicar vagas.' }
  }

  const fieldErrors = validateVaga(formData)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Dados inválidos', fieldErrors }
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
    return { success: false, error: 'Empresa inválida.' }
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, is_approved, estado')
    .eq('id', companyId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (companyError || !company) {
    return { success: false, error: 'Empresa não encontrada. Cadastre a sua empresa primeiro.' }
  }

  if (!company.is_approved || company.estado !== 'aprovado') {
    return { success: false, error: 'A sua empresa ainda não foi aprovada. Não é possível publicar vagas.' }
  }

  const baseSlug = generateSlug(formData.titulo)
  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data: existing } = await supabase
      .from('vagas')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const { error } = await supabase
    .from('vagas')
    .insert({
      company_id: company.id,
      titulo: formData.titulo.trim(),
      slug,
      descricao: formData.descricao.trim(),
      requisitos: formData.requisitos?.trim() || null,
      categoria: formData.categoria.trim(),
      provincia: formData.provincia.trim(),
      municipio: formData.municipio?.trim() || null,
      tipo_contrato: formData.tipo_contrato?.trim() || null,
      salario: formData.salario?.trim() || null,
      whatsapp: formData.whatsapp.trim(),
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe uma vaga com este título. Tente outro.' }
    }
    if (error.code === '42501') {
      return { success: false, error: 'Sem permissão para criar vaga. Verifique a sua empresa.' }
    }
    console.error('Erro ao criar vaga:', error)
    return { success: false, error: 'Erro ao criar vaga. Tente novamente.' }
  }

  revalidatePath('/vagas')
  revalidatePath('/empresa/painel/vagas')
  redirect('/empresa/painel/vagas?cadastro=sucesso')
}

export type EmpresaPainel = {
  id: string
  name: string
  slug: string
  is_approved: boolean
  estado: string | null
  sector: string | null
  province: string | null
  city: string | null
}

export async function getUserCompanies(): Promise<EmpresaPainel[] | null> {
  if (await isAdmin()) return null
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, slug, is_approved, estado, sector, province, city')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao listar empresas do utilizador. Código:', error.code)
    return null
  }
  return (data ?? []) as EmpresaPainel[]
}

export async function getUserCompany(companyId?: string): Promise<EmpresaPainel | null> {
  const empresas = await getUserCompanies()
  if (!empresas) return null
  if (companyId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) return null
    return empresas.find((empresa) => empresa.id === companyId) ?? null
  }
  return empresas[0] ?? null
}

export type VagaListItem = {
  id: string
  titulo: string
  slug: string
  estado: string
  categoria: string
  provincia: string
  created_at: string
  encerrada_em: string | null
}

export type VagasEmpresaResult =
  | { success: true; data: VagaListItem[] }
  | { success: false; error: string }

export async function getUserVagasResult(companyId?: string): Promise<VagasEmpresaResult> {
  const company = await getUserCompany(companyId)
  if (!company) return { success: false, error: 'Não foi possível identificar a empresa desta sessão.' }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('vagas')
    .select('id, titulo, slug, estado, categoria, provincia, created_at, encerrada_em')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar vagas da empresa. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar as vagas da empresa. Tente novamente.' }
  }
  return { success: true, data: (data ?? []) as VagaListItem[] }
}

export async function getUserVagas(companyId?: string): Promise<VagaListItem[]> {
  const result = await getUserVagasResult(companyId)
  return result.success ? result.data : []
}

export type VagaAdminItem = {
  id: string
  titulo: string
  slug: string
  estado: string
  categoria: string
  provincia: string
  created_at: string
  company: {
    id: string
    name: string
  }[] | null
}

export async function getAllVagasAdmin(): Promise<VagaAdminItem[]> {
  if (!(await isAdmin())) return []
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('vagas')
    .select(`
      id,
      titulo,
      slug,
      estado,
      categoria,
      provincia,
      created_at,
      company:companies!company_id (id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar todas as vagas (admin):', error)
    return []
  }

  return data as VagaAdminItem[]
}

export async function aprovarVaga(vagaId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  if (!(await isAdmin())) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vagaId)) {
    return { success: false, error: 'Vaga inválida.' }
  }

  const { data: vaga, error: leituraError } = await supabase
    .from('vagas')
    .select('id, titulo, company_id')
    .eq('id', vagaId)
    .maybeSingle()

  if (leituraError || !vaga) {
    return { success: false, error: 'Vaga não encontrada.' }
  }

  const { error } = await supabase
    .from('vagas')
    .update({ estado: 'aprovado' })
    .eq('id', vagaId)

  if (error) {
    console.error('Erro ao aprovar vaga:', error)
    return { success: false, error: 'Erro ao aprovar vaga. Tente novamente.' }
  }

  const { data: empresa } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', vaga.company_id)
    .maybeSingle()

  if (empresa?.user_id) {
    await criarNotificacao(
      supabase,
      empresa.user_id,
      'vaga_aprovada',
      'Vaga aprovada',
      `A vaga “${vaga.titulo}” foi aprovada e já está visível na plataforma.`,
      vaga.id
    )
  }

  revalidatePath('/admin/vagas')
  revalidatePath('/vagas')
  return { success: true }
}

export async function rejeitarVaga(vagaId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Utilizador não autenticado' }
  }

  const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin')
  if (adminError || !isAdminData) {
    return { success: false, error: 'Acesso negado. Privilégios de administrador necessários.' }
  }

  const { data: vaga, error: leituraError } = await supabase
    .from('vagas')
    .select('id, titulo, company_id')
    .eq('id', vagaId)
    .maybeSingle()

  if (leituraError || !vaga) {
    return { success: false, error: 'Vaga não encontrada.' }
  }

  const { error } = await supabase
    .from('vagas')
    .update({ estado: 'rejeitado' })
    .eq('id', vagaId)

  if (error) {
    console.error('Erro ao rejeitar vaga:', error)
    return { success: false, error: 'Erro ao rejeitar vaga. Tente novamente.' }
  }

  const { data: empresa } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', vaga.company_id)
    .maybeSingle()

  if (empresa?.user_id) {
    await criarNotificacao(
      supabase,
      empresa.user_id,
      'vaga_rejeitada',
      'Vaga rejeitada',
      `A vaga “${vaga.titulo}” foi rejeitada. Reveja os dados e torne a submeter, se necessário.`,
      vaga.id
    )
  }

  revalidatePath('/admin/vagas')
  revalidatePath('/vagas')
  return { success: true }
}


export type VagaDetalheEmpresa = {
  id: string
  slug: string
  estado: string
  encerrada_em: string | null
  titulo: string
  descricao: string
  requisitos: string | null
  categoria: string
  provincia: string
  municipio: string | null
  tipo_contrato: string | null
  salario: string | null
  whatsapp: string | null
}

export async function getUserVaga(companyId: string, vagaId: string): Promise<VagaDetalheEmpresa | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vagaId)) return null
  const company = await getUserCompany(companyId)
  if (!company) return null

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('vagas')
    .select('id, slug, estado, encerrada_em, titulo, descricao, requisitos, categoria, provincia, municipio, tipo_contrato, salario, whatsapp')
    .eq('id', vagaId)
    .eq('company_id', company.id)
    .maybeSingle()

  if (error) {
    console.error('Erro ao carregar vaga para edição. Código:', error.code)
    return null
  }
  return data as VagaDetalheEmpresa | null
}

export async function updateVaga(vagaId: string, companyId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vagaId)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
    return { success: false, error: 'Vaga ou empresa inválida.' }
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, is_approved')
    .eq('id', companyId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (companyError || !company) return { success: false, error: 'Empresa não encontrada ou sem permissão.' }
  if (!company.is_approved) return { success: false, error: 'A empresa precisa de estar aprovada para editar vagas.' }

  const data: VagaFormData = {
    titulo: String(formData.get('titulo') ?? '').trim(),
    descricao: String(formData.get('descricao') ?? '').trim(),
    requisitos: String(formData.get('requisitos') ?? '').trim(),
    categoria: String(formData.get('categoria') ?? '').trim(),
    provincia: String(formData.get('provincia') ?? '').trim(),
    municipio: String(formData.get('municipio') ?? '').trim(),
    tipo_contrato: String(formData.get('tipo_contrato') ?? '').trim(),
    salario: String(formData.get('salario') ?? '').trim(),
    whatsapp: String(formData.get('whatsapp') ?? '').trim(),
  }
  const fieldErrors = validateVaga(data)
  if (Object.keys(fieldErrors).length > 0) return { success: false, error: 'Verifique os campos assinalados.', fieldErrors }

  const { data: vaga, error: vagaError } = await supabase
    .from('vagas')
    .select('slug')
    .eq('id', vagaId)
    .eq('company_id', company.id)
    .is('encerrada_em', null)
    .maybeSingle()

  if (vagaError || !vaga) return { success: false, error: 'Vaga não encontrada, encerrada ou sem permissão.' }

  const { data: updated, error } = await supabase
    .from('vagas')
    .update({
      titulo: data.titulo,
      descricao: data.descricao,
      requisitos: data.requisitos || null,
      categoria: data.categoria,
      provincia: data.provincia,
      municipio: data.municipio || null,
      tipo_contrato: data.tipo_contrato || null,
      salario: data.salario || null,
      whatsapp: data.whatsapp,
    })
    .eq('id', vagaId)
    .eq('company_id', company.id)
    .is('encerrada_em', null)
    .select('slug')
    .maybeSingle()

  if (error || !updated) {
    console.error('Erro ao atualizar vaga. Código:', error?.code)
    return { success: false, error: 'Não foi possível guardar as alterações. Confirme se a vaga continua aberta.' }
  }

  revalidatePath('/empresa/painel/vagas')
  revalidatePath('/vagas')
  revalidatePath(`/vaga/${updated.slug}`)
  return { success: true }
}

export async function encerrarVaga(vagaId: string, companyId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vagaId)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
    return { success: false, error: 'Vaga ou empresa inválida.' }
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (companyError || !company) return { success: false, error: 'Empresa não encontrada ou sem permissão.' }

  const { data: vaga, error: vagaError } = await supabase
    .from('vagas')
    .select('id, slug, estado, encerrada_em')
    .eq('id', vagaId)
    .eq('company_id', company.id)
    .maybeSingle()

  if (vagaError || !vaga) return { success: false, error: 'Vaga não encontrada ou sem permissão.' }
  if (vaga.encerrada_em) return { success: false, error: 'Esta vaga já se encontra encerrada.' }
  if (vaga.estado !== 'aprovado') return { success: false, error: 'Só é possível encerrar vagas aprovadas e publicadas.' }

  const { data: updated, error } = await supabase
    .from('vagas')
    .update({ encerrada_em: new Date().toISOString() })
    .eq('id', vagaId)
    .eq('company_id', company.id)
    .is('encerrada_em', null)
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    console.error('Erro ao encerrar vaga. Código:', error?.code)
    return { success: false, error: 'Não foi possível encerrar a vaga. Atualize a página e tente novamente.' }
  }

  revalidatePath('/empresa/painel/vagas')
  revalidatePath('/vagas')
  revalidatePath(`/vaga/${vaga.slug}`)
  revalidatePath('/empresa/painel/candidaturas')
  return { success: true }
}
