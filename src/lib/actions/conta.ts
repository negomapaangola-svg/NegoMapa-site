'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'

type ContaProfile = {
  id: string
  nome: string | null
  telefone: string | null
  whatsapp: string | null
  avatar_url: string | null
  account_type: 'profissional' | 'empresa' | 'cliente'
  localizacao_provincia: string | null
  localizacao_municipio: string | null
  localizacao_bairro: string | null
  is_active: boolean
}
type ContaProfessional = {
  id: string
  nome: string | null
  telefone: string | null
  whatsapp: string | null
  bio: string | null
  provincia: string | null
  municipio: string | null
  bairro: string | null
  estado: string
  avatar_url: string | null
  categoria_id: string | null
  especialidades: string[] | null
  disponibilidade: string | null
  disponibilidade_dias: string[] | null
  disponibilidade_horarios: Record<string, boolean> | null
  experiencia_faixa: string | null
  profile_completed_at: string | null
  portfolio: unknown
}
type ContaCompany = {
  id: string
  name: string
  email: string | null
  profile_completed_at: string | null
  sector: string
  province: string
  city: string | null
  bairro: string | null
  rua: string | null
  referencia_localizacao: string | null
  website: string | null
  description: string | null
  whatsapp: string | null
  phone: string | null
  logo_url: string | null
  is_approved: boolean | null
  estado: string | null
  horario_atendimento: string | null
  portfolio: unknown
}
type ContaDetails = {
  formacao?: string | null
  preferencias?: string | null
  disponibilidade?: string | null
  tipo_empresa?: string | null
  tamanho_empresa?: string | null
}
type AvaliacaoConta = { id: string; nota: number; comentario: string | null; created_at: string }

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

export type ContaSnapshot = {
  user: { id: string; email: string }
  profile: ContaProfile
  professional: ContaProfessional | null
  company: ContaCompany | null
  details: ContaDetails
  accountType: 'profissional' | 'empresa' | 'cliente'
}

async function authenticated(allowAdmin = false) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login?redirectTo=/conta')
  if (!allowAdmin && await isAdmin()) redirect('/admin')
  return { supabase, user }
}

export async function getContaSnapshot(): Promise<ContaSnapshot | null> {
  const { supabase, user } = await authenticated()
  const [profileResult, detailsResult] = await Promise.all([
    supabase.from('profiles').select('id,nome,telefone,whatsapp,avatar_url,account_type,localizacao_provincia,localizacao_municipio,localizacao_bairro,is_active').eq('id', user.id).maybeSingle(),
    supabase.from('conta_detalhes').select('formacao,preferencias,disponibilidade,tipo_empresa,tamanho_empresa').eq('user_id', user.id).maybeSingle(),
  ])

  if (profileResult.error || detailsResult.error) {
    console.error('Erro ao carregar dados da conta.', {
      profile: profileResult.error?.code,
      details: detailsResult.error?.code,
    })
    throw new Error('Não foi possível carregar os dados da conta. Actualize a página ou tente novamente.')
  }

  const profile = profileResult.data
  const accountType = profile?.account_type
  if (!profile || (accountType !== 'profissional' && accountType !== 'empresa' && accountType !== 'cliente')) {
    redirect('/escolher-tipo')
  }
  if (profile.is_active !== true) redirect('/conta?erro=conta-inactiva')

  // A conta cliente não consulta tabelas de negócio: registos legados não
  // alteram o papel nem podem impedir a leitura do perfil pessoal.
  let professional: ContaProfessional | null = null
  let company: ContaCompany | null = null

  if (accountType === 'profissional') {
    const { data, error } = await supabase.rpc('get_my_professional_account')
    if (error) {
      console.error('Erro ao carregar perfil profissional próprio. Código:', error.code)
      throw new Error('Não foi possível carregar o perfil profissional.')
    }
    const row = Array.isArray(data) ? data[0] : data
    professional = (row as ContaProfessional | null) ?? null
    const { data: completion, error: completionError } = await supabase.rpc('get_my_profile_completion')
    if (completionError) throw new Error('Não foi possível carregar os dados de conclusão do perfil.')
    if (professional) professional = { ...professional, experiencia_faixa: completion?.experiencia_faixa ?? null, profile_completed_at: completion?.profile_completed_at ?? null }
  } else if (accountType === 'empresa') {
    const { data, error } = await supabase.rpc('get_my_company_profile')
    if (error) {
      console.error('Erro ao carregar perfil empresarial próprio. Código:', error.code)
      throw new Error('Não foi possível carregar o perfil empresarial.')
    }
    const row = Array.isArray(data) ? data[0] : data
    company = (row as ContaCompany | null) ?? null
    const { data: completion, error: completionError } = await supabase.rpc('get_my_profile_completion')
    if (completionError) throw new Error('Não foi possível carregar os dados de conclusão do perfil.')
    if (company) company = { ...company, email: completion?.email ?? null, profile_completed_at: completion?.profile_completed_at ?? null }
  }

  return {
    user: { id: user.id, email: user.email ?? '' },
    profile: profile as ContaProfile,
    professional,
    company,
    details: (detailsResult.data as ContaDetails | null) ?? {},
    accountType,
  }
}

function field(form: FormData, name: string) {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function storagePath(value: string, bucket: string): string | null {
  if (!value) return null
  if (value.startsWith('/api/imagens/')) {
    const parts = value.split('/').slice(3)
    if (parts.shift() !== bucket) return null
    return parts.map(decodeURIComponent).join('/')
  }
  if (value.startsWith('http')) {
    try {
      const pathname = new URL(value).pathname
      const marker = '/storage/v1/object/'
      const index = pathname.indexOf(marker)
      if (index < 0) return null
      const parts = pathname.slice(index + marker.length).split('/')
      if (parts[0] === 'public' || parts[0] === 'sign') parts.shift()
      if (parts.shift() !== bucket) return null
      return parts.map(decodeURIComponent).join('/')
    } catch { return null }
  }
  return bucket === 'clientes-avatars' ? value : null
}

function validImageRef(value: string, bucket: string, userId: string, folder: 'avatar' | 'portfolio') {
  const path = storagePath(value, bucket)
  if (!path) return false
  if (new RegExp('^' + userId + '/' + folder + '/[0-9a-f-]{36}\\.(webp|jpg|png)$', 'i').test(path)) return true
  if (folder === 'avatar' && bucket === 'profissionais-avatars') {
    return new RegExp('^' + userId + '/avatars/[0-9a-f-]{36}\\.(webp|jpg|png)$', 'i').test(path)
  }
  if (folder === 'avatar' && bucket === 'empresas-logos') {
    return new RegExp('^' + userId + '/logotipo-[0-9]+\\.(webp|jpg|png)$', 'i').test(path)
  }
  return false
}

function validPortfolioItems(value: unknown, bucket: string, userId: string) {
  if (!Array.isArray(value)) return false
  return value.every(item => {
    if (typeof item === 'string') return validImageRef(item, bucket, userId, 'portfolio')
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    const record = item as Record<string, unknown>
    const imageKeys = ['imagem_url', 'image_url', 'foto_url', 'url_imagem', 'url_projeto']
    return imageKeys.every(key => {
      const itemValue = record[key]
      if (itemValue === undefined || itemValue === null) return true
      if (key === 'url_projeto' && typeof itemValue === 'string' && !itemValue.startsWith('/api/imagens/') && !itemValue.includes('/storage/v1/object/')) return true
      return typeof itemValue === 'string' && validImageRef(itemValue, bucket, userId, 'portfolio')
    })
  })
}

function imageRefs(value: unknown, bucket: string, userId: string): string[] {
  const strings: string[] = []
  const collect = (item: unknown) => {
    if (typeof item === 'string') strings.push(item)
    else if (Array.isArray(item)) item.forEach(collect)
    else if (item && typeof item === 'object') Object.values(item as Record<string, unknown>).forEach(collect)
  }
  collect(value)
  return [...new Set(strings.map(item => storagePath(item, bucket)).filter((path): path is string =>
    Boolean(path && path.startsWith(userId + '/') && new RegExp('^' + userId + '/(avatar|portfolio)/[0-9a-f-]{36}\\.(webp|jpg|png)$', 'i').test(path))
  ))]
}

async function cleanupUnreferencedImages(supabase: ServerSupabase, bucket: string, oldRefs: string[], newRefs: string[]) {
  const stillUsed = new Set(newRefs)
  for (const path of [...new Set(oldRefs)]) {
    if (stillUsed.has(path)) continue
    const { data, error } = await supabase.rpc('pode_apagar_imagem', { p_bucket: bucket, p_name: path })
    if (error || data !== true) continue
    await supabase.storage.from(bucket).remove([path])
  }
}


function portfolioImageRef(item: unknown, bucket: string): { ref: string; key: string } | null {
  if (typeof item === 'string') {
    const path = storagePath(item, bucket)
    return path ? { ref: item.startsWith('/api/imagens/') ? item : '/api/imagens/' + bucket + '/' + path.split('/').map(encodeURIComponent).join('/'), key: '' } : null
  }
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null
  const record = item as Record<string, unknown>
  for (const key of ['imagem_url', 'image_url', 'foto_url', 'url_imagem', 'url_projeto']) {
    if (typeof record[key] !== 'string') continue
    const raw = record[key] as string
    const path = storagePath(raw, bucket)
    if (path) return { ref: raw.startsWith('/api/imagens/') ? raw : '/api/imagens/' + bucket + '/' + path.split('/').map(encodeURIComponent).join('/'), key }
  }
  return null
}

function portfolioWithImageRefs(existing: unknown, refs: string[], bucket: string): unknown[] {
  const current = Array.isArray(existing) ? existing : []
  const entries = current.map(item => ({ item, image: portfolioImageRef(item, bucket) }))
  const preserved = entries.filter(entry => !entry.image).map(entry => entry.item)
  const images = refs.map(ref => {
    const previous = entries.find(entry => entry.image?.ref === ref)
    if (!previous) return { imagem_url: ref }
    if (typeof previous.item === 'string') return ref
    const key = previous.image?.key || 'imagem_url'
    return { ...(previous.item as Record<string, unknown>), [key]: ref }
  })
  return [...preserved, ...images]
}

async function ownedCompany(supabase: ServerSupabase, userId: string) {
  const { data, error } = await supabase.from('companies')
    .select('id,name,sector,province,city,description,email,phone,whatsapp,logo_url,portfolio,is_approved,estado,profile_completed_at,created_at')
    .eq('user_id', userId)
    .order('is_approved', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error('Não foi possível identificar a empresa da conta.')
  return data
}

export async function guardarReferenciasImagem(input: {
  bucket: string
  folder: 'avatar' | 'portfolio'
  refs: string[]
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await authenticated()
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('account_type').eq('id', user.id).maybeSingle()
  if (profileError || !profile) return { ok: false, error: 'Não foi possível validar a conta.' }

  const expected: Record<string, { avatar: string; portfolio?: string }> = {
    profissional: { avatar: 'profissionais-avatars', portfolio: 'profissionais-portfolio' },
    empresa: { avatar: 'empresas-logos', portfolio: 'empresas-portfolio' },
    cliente: { avatar: 'clientes-avatars' },
  }
  const account = expected[profile?.account_type ?? '']
  if (!account || (input.folder === 'avatar' ? input.bucket !== account.avatar : input.bucket !== account.portfolio)) {
    return { ok: false, error: 'O tipo de conta não tem permissão para este armazenamento.' }
  }
  if (!Array.isArray(input.refs) || input.refs.some(ref => typeof ref !== 'string') || input.refs.length > 12 || (input.folder === 'avatar' && input.refs.length > 1)) {
    return { ok: false, error: 'Lista de imagens inválida.' }
  }

  const refs = [...new Set(input.refs)]
  for (const ref of refs) {
    const path = storagePath(ref, input.bucket)
    if (!path || !path.startsWith(user.id + '/') || !validImageRef(ref, input.bucket, user.id, input.folder)) {
      return { ok: false, error: 'A imagem não pertence a esta conta ou tem um caminho inválido.' }
    }
    const segments = path.split('/')
    const filename = segments.pop()!
    const directory = segments.join('/')
    const { data: files, error } = await supabase.storage.from(input.bucket).list(directory, { search: filename, limit: 100 })
    if (error || !files?.some(file => file.name === filename)) {
      return { ok: false, error: 'A imagem não foi encontrada no armazenamento privado.' }
    }
  }

  const oldRefs: string[] = []
  let updateError: { message: string } | null = null
  if (input.folder === 'avatar') {
    const value = refs[0] ?? null
    if (profile.account_type === 'profissional') {
      const { data: old } = await supabase.from('profissionais').select('avatar_url').eq('user_id', user.id).maybeSingle()
      oldRefs.push(...imageRefs(old?.avatar_url, input.bucket, user.id))
      const { error } = await supabase.from('profissionais').update({ avatar_url: value }).eq('user_id', user.id)
      updateError = error
    } else if (profile.account_type === 'empresa') {
      const company = await ownedCompany(supabase, user.id)
      if (!company) return { ok: false, error: 'Não existe uma empresa associada à conta.' }
      oldRefs.push(...imageRefs(company.logo_url, input.bucket, user.id))
      const { error } = await supabase.from('companies').update({ logo_url: value }).eq('id', company.id).eq('user_id', user.id)
      updateError = error
    } else {
      const { data: old } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
      oldRefs.push(...imageRefs(old?.avatar_url, input.bucket, user.id))
      const { error } = await supabase.from('profiles').update({ avatar_url: value, updated_at: new Date().toISOString() }).eq('id', user.id)
      updateError = error
    }
  } else {
    if (profile.account_type === 'profissional') {
      const { data: old } = await supabase.from('profissionais').select('portfolio').eq('user_id', user.id).maybeSingle()
      oldRefs.push(...imageRefs(old?.portfolio, input.bucket, user.id))
      const portfolio = portfolioWithImageRefs(old?.portfolio, refs, input.bucket)
      const { error } = await supabase.from('profissionais').update({ portfolio }).eq('user_id', user.id)
      updateError = error
    } else if (profile.account_type === 'empresa') {
      const company = await ownedCompany(supabase, user.id)
      if (!company) return { ok: false, error: 'Não existe uma empresa associada à conta.' }
      oldRefs.push(...imageRefs(company.portfolio, input.bucket, user.id))
      const portfolio = portfolioWithImageRefs(company.portfolio, refs, input.bucket)
      const { error } = await supabase.from('companies').update({ portfolio }).eq('id', company.id).eq('user_id', user.id)
      updateError = error
    }
  }
  if (updateError) return { ok: false, error: 'Não foi possível guardar a referência da imagem.' }

  // Confirma que a referência persistiu antes de comunicar sucesso ou remover objectos antigos.
  let persisted = false
  if (input.folder === 'avatar' && profile.account_type === 'profissional') {
    const { data } = await supabase.from('profissionais').select('avatar_url').eq('user_id', user.id).maybeSingle()
    persisted = (data?.avatar_url ?? null) === (refs[0] ?? null)
  } else if (input.folder === 'avatar' && profile.account_type === 'empresa') {
    const company = await ownedCompany(supabase, user.id)
    persisted = (company?.logo_url ?? null) === (refs[0] ?? null)
  } else if (input.folder === 'avatar') {
    const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
    persisted = (data?.avatar_url ?? null) === (refs[0] ?? null)
  } else if (profile.account_type === 'profissional') {
    const { data } = await supabase.from('profissionais').select('portfolio').eq('user_id', user.id).maybeSingle()
    persisted = refs.every(ref => JSON.stringify(data?.portfolio ?? []).includes(ref))
  } else {
    const company = await ownedCompany(supabase, user.id)
    persisted = refs.every(ref => JSON.stringify(company?.portfolio ?? []).includes(ref))
  }
  if (!persisted) return { ok: false, error: 'A base de dados não confirmou a referência da imagem.' }

  const newPaths = refs.map(ref => storagePath(ref, input.bucket)).filter((path): path is string => Boolean(path))
  await cleanupUnreferencedImages(supabase, input.bucket, oldRefs, newPaths)
  revalidatePath('/conta')
  revalidatePath('/conta/perfil')
  revalidatePath('/perfil')
  return { ok: true }
}

export async function guardarPerfilConta(form: FormData): Promise<void> {
  const { supabase, user } = await authenticated()
  const { data: profile, error: profileError } = await supabase.from('profiles').select('account_type,is_active').eq('id', user.id).maybeSingle()
  const tipo = profile?.account_type
  if (profileError || !['profissional', 'empresa', 'cliente'].includes(tipo)) redirect('/escolher-tipo')
  if (profile?.is_active !== true) redirect('/conta/perfil?erro=conta-inactiva')

  // Snapshot das referências antigas antes de alterar os registos.
  let oldAvatarRefs: string[] = []
  let oldPortfolioRefs: string[] = []
  if (tipo === 'profissional') {
    const { data: old } = await supabase.from('profissionais').select('avatar_url,portfolio').eq('user_id', user.id).maybeSingle()
    oldAvatarRefs = imageRefs(old?.avatar_url, 'profissionais-avatars', user.id)
    oldPortfolioRefs = imageRefs(old?.portfolio, 'profissionais-portfolio', user.id)
  } else if (tipo === 'empresa') {
    const old = await ownedCompany(supabase, user.id)
    oldAvatarRefs = imageRefs(old?.logo_url, 'empresas-logos', user.id)
    oldPortfolioRefs = imageRefs(old?.portfolio, 'empresas-portfolio', user.id)
  } else {
    const { data: old } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
    oldAvatarRefs = imageRefs(old?.avatar_url, 'clientes-avatars', user.id)
  }

  const nome = field(form, 'nome')
  const telefone = field(form, 'telefone')
  const whatsapp = field(form, 'whatsapp')
  if (nome.length < 2 || nome.length > (tipo === 'empresa' ? 160 : 120) || /[<>]/.test(nome)) redirect('/conta/perfil?erro=nome')
  if (telefone.length > 32 || whatsapp.length > 32 || ((tipo === 'profissional' || tipo === 'empresa') && !telefone && !whatsapp)) redirect('/conta/perfil?erro=contacto')

  if (tipo === 'profissional') {
    const avatar = field(form, 'avatar_url')
    if (avatar && !validImageRef(avatar, 'profissionais-avatars', user.id, 'avatar')) redirect('/conta/perfil?erro=avatar')
    const especialidades = field(form, 'especialidades').split(',').map(v => v.trim()).filter(Boolean).slice(0, 20)
    const portfolioRaw = field(form, 'portfolio')
    let portfolio: unknown = []
    if (portfolioRaw) {
      try { portfolio = JSON.parse(portfolioRaw) } catch { redirect('/conta/perfil?erro=portfolio') }
      if (!validPortfolioItems(portfolio, 'profissionais-portfolio', user.id)) redirect('/conta/perfil?erro=portfolio')
    }
    const { data: owned } = await supabase.from('profissionais').select('id,nome,categoria_id,provincia,municipio,experiencia_faixa,bio,telefone,whatsapp').eq('user_id', user.id).maybeSingle()
    if (!owned) redirect('/conta/perfil?erro=sem-perfil')
    const categoriaId = field(form, 'categoria_id') || null
    const provincia = field(form, 'provincia') || null
    const municipio = field(form, 'municipio') || null
    if (!provincia || !municipio) redirect('/conta/perfil?erro=localizacao')
    const experiencia = field(form, 'experiencia_faixa') || null
    const bio = field(form, 'bio') || null
    const requiredChanged = owned.nome !== nome || owned.categoria_id !== categoriaId || owned.provincia !== provincia || owned.municipio !== municipio || owned.experiencia_faixa !== experiencia || owned.bio !== bio || owned.telefone !== (telefone || null) || owned.whatsapp !== (whatsapp || null)
    const { data: actualizado, error } = await supabase.from('profissionais').update({
      nome, telefone: telefone || null, whatsapp: whatsapp || null, bio,
      provincia, municipio, bairro: field(form, 'bairro') || null,
      categoria_id: categoriaId, experiencia_faixa: experiencia, especialidades,
      disponibilidade: field(form, 'disponibilidade') || null, avatar_url: avatar || null, portfolio,
      ...(requiredChanged ? { profile_completed_at: null } : {}),
    }).eq('user_id', user.id).select('id').maybeSingle()
    if (error || !actualizado) redirect('/conta/perfil?erro=guardar')
  } else if (tipo === 'empresa') {
    const logo = field(form, 'logo_url')
    if (logo && !validImageRef(logo, 'empresas-logos', user.id, 'avatar')) redirect('/conta/perfil?erro=avatar')
    const portfolioRaw = field(form, 'portfolio')
    let portfolio: unknown = []
    if (portfolioRaw) {
      try { portfolio = JSON.parse(portfolioRaw) } catch { redirect('/conta/perfil?erro=portfolio') }
      if (!validPortfolioItems(portfolio, 'empresas-portfolio', user.id)) redirect('/conta/perfil?erro=portfolio')
    }
    const owned = await ownedCompany(supabase, user.id)
    if (!owned) redirect('/conta/perfil?erro=sem-perfil')
    const sector = field(form, 'sector')
    const province = field(form, 'province')
    const city = field(form, 'city')
    if (!province || !city) redirect('/conta/perfil?erro=localizacao')
    const description = field(form, 'description')
    const email = field(form, 'email').toLowerCase()
    const requiredChanged = owned.name !== nome || owned.sector !== sector || owned.province !== province || owned.city !== (city || null) || owned.description !== (description || null) || owned.email !== (email || null) || owned.phone !== (telefone || null) || owned.whatsapp !== (whatsapp || null)
    const { data: actualizado, error } = await supabase.from('companies').update({
      name: nome, sector: sector || 'Geral', email: email || null, phone: telefone || null,
      whatsapp: whatsapp || null, province: province || '', city: city || null,
      bairro: field(form, 'bairro') || null, rua: field(form, 'rua') || null, referencia_localizacao: field(form, 'referencia_localizacao') || null, website: field(form, 'website') || null,
      description: description || null, horario_atendimento: field(form, 'disponibilidade') || null,
      logo_url: logo || null, portfolio,
      ...(requiredChanged ? { profile_completed_at: null } : {}),
    }).eq('id', owned.id).eq('user_id', user.id).select('id').maybeSingle()
    if (error || !actualizado) redirect('/conta/perfil?erro=guardar')
  } else {
    const avatar = field(form, 'avatar_url')
    if (avatar && !validImageRef(avatar, 'clientes-avatars', user.id, 'avatar')) redirect('/conta/perfil?erro=avatar')
    const { data: actualizado, error } = await supabase.from('profiles').update({
      nome, telefone: telefone || null, whatsapp: whatsapp || null, avatar_url: avatar || null,
      localizacao_provincia: field(form, 'provincia') || null,
      localizacao_municipio: field(form, 'municipio') || null,
      localizacao_bairro: field(form, 'bairro') || null,
    }).eq('id', user.id).select('id').maybeSingle()
    if (error || !actualizado) redirect('/conta/perfil?erro=guardar')
  }

  const details = {
    user_id: user.id,
    formacao: field(form, 'formacao') || null,
    preferencias: field(form, 'preferencias') || null,
    disponibilidade: field(form, 'disponibilidade') || null,
    tipo_empresa: field(form, 'tipo_empresa') || null,
    tamanho_empresa: field(form, 'tamanho_empresa') || null,
    updated_at: new Date().toISOString(),
  }
  const { data: detalhesGuardados, error: detailsError } = await supabase
    .from('conta_detalhes')
    .upsert(details, { onConflict: 'user_id' })
    .select('user_id')
    .maybeSingle()
  if (detailsError || detalhesGuardados?.user_id !== user.id) {
    if (detailsError) console.error('Erro ao guardar dados complementares da conta. Código:', detailsError.code)
    redirect('/conta/perfil?erro=detalhes')
  }

  // Só depois de todas as gravações bem-sucedidas tentamos remover referências antigas.
  if (tipo === 'profissional') {
    const { data: current } = await supabase.from('profissionais').select('avatar_url,portfolio').eq('user_id', user.id).maybeSingle()
    await cleanupUnreferencedImages(supabase, 'profissionais-avatars', oldAvatarRefs, imageRefs(current?.avatar_url, 'profissionais-avatars', user.id))
    await cleanupUnreferencedImages(supabase, 'profissionais-portfolio', oldPortfolioRefs, imageRefs(current?.portfolio, 'profissionais-portfolio', user.id))
  } else if (tipo === 'empresa') {
    const current = await ownedCompany(supabase, user.id)
    await cleanupUnreferencedImages(supabase, 'empresas-logos', oldAvatarRefs, imageRefs(current?.logo_url, 'empresas-logos', user.id))
    await cleanupUnreferencedImages(supabase, 'empresas-portfolio', oldPortfolioRefs, imageRefs(current?.portfolio, 'empresas-portfolio', user.id))
  } else {
    const { data: current } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
    await cleanupUnreferencedImages(supabase, 'clientes-avatars', oldAvatarRefs, imageRefs(current?.avatar_url, 'clientes-avatars', user.id))
  }

  if (field(form, 'intent') === 'complete' && (tipo === 'profissional' || tipo === 'empresa')) {
    const { data: completion, error: completionError } = await supabase.rpc('complete_my_profile', { p_profile_type: tipo })
    if (completionError || completion?.completed !== true) {
      console.error('Erro ao concluir perfil. Código:', completionError?.code)
      redirect('/conta/perfil?erro=complete')
    }
  }

  revalidatePath('/conta')
  revalidatePath('/conta/perfil')
  revalidatePath('/perfil')
  redirect(field(form, 'intent') === 'complete' ? '/conta/perfil?concluido=1' : '/conta/perfil?salvo=1')
}

export async function getContaConteudo() {
  const { supabase, user } = await authenticated()
  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle()
  const type = profile?.account_type
  const [professional, company] = await Promise.all([
    supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle(),
  ])
  if (type === 'profissional' && professional.data) {
    const { data } = await supabase.from('servicos').select('id,titulo,estado,created_at').eq('profissional_id', professional.data.id).order('created_at', { ascending: false }).limit(30)
    return { type, services: data ?? [], products: [], jobs: [], orders: [], applications: [] }
  }
  if (type === 'empresa' && company.data) {
    const [services, products, jobs] = await Promise.all([
      supabase.from('servicos').select('id,titulo,estado,created_at').eq('company_id', company.data.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('produtos').select('id,titulo,estado_aprovacao,criado_em').eq('company_id', company.data.id).order('criado_em', { ascending: false }).limit(30),
      supabase.from('vagas').select('id,titulo,estado,created_at').eq('company_id', company.data.id).order('created_at', { ascending: false }).limit(30),
    ])
    return { type, services: services.data ?? [], products: products.data ?? [], jobs: jobs.data ?? [], orders: [], applications: [] }
  }
  const [orders, applications] = await Promise.all([
    supabase.from('pedidos_servico').select('id,titulo,estado,criada_em').eq('cliente_id', user.id).order('criada_em', { ascending: false }).limit(30),
    supabase.from('candidaturas').select('id,nome_candidato,estado,criada_em').eq('user_id', user.id).order('criada_em', { ascending: false }).limit(30),
  ])
  return { type, services: [], products: [], jobs: [], orders: orders.data ?? [], applications: applications.data ?? [] }
}

export async function getContaMensagens() {
  const { supabase, user } = await authenticated()
  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle()
  const type = profile?.account_type
  let query = supabase.from('conversas').select('id,criada_em').eq('cliente_id', user.id)
  if (type === 'profissional') {
    const { data: own } = await supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle()
    query = supabase.from('conversas').select('id,criada_em').eq('profissional_id', own?.id ?? '00000000-0000-0000-0000-000000000000')
  } else if (type === 'empresa') {
    const { data: own } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()
    query = supabase.from('conversas').select('id,criada_em').eq('empresa_id', own?.id ?? '00000000-0000-0000-0000-000000000000')
  }
  const { data: conversations } = await query.order('criada_em', { ascending: false }).limit(50)
  const ids = (conversations ?? []).map(c => c.id)
  if (!ids.length) return []
  const { data: messages } = await supabase.from('mensagens').select('id,conversa_id,remetente_id,conteudo,lida_em,criada_em').in('conversa_id', ids).order('criada_em', { ascending: false }).limit(100)
  return (messages ?? []).map(message => ({ ...message, isMine: message.remetente_id === user.id }))
}

export async function getContaAvaliacoes() {
  const { supabase, user } = await authenticated()
  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle()
  const [professional, company, given] = await Promise.all([
    supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('avaliacoes').select('id,nota,comentario,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ])
  let received: AvaliacaoConta[] = []
  if (profile?.account_type === 'profissional' && professional.data) {
    const { data } = await supabase.from('avaliacoes').select('id,nota,comentario,created_at').eq('profissional_id', professional.data.id).order('created_at', { ascending: false }).limit(50)
    received = data ?? []
  } else if (profile?.account_type === 'empresa' && company.data) {
    const { data } = await supabase.from('avaliacoes').select('id,nota,comentario,created_at').eq('company_id', company.data.id).order('created_at', { ascending: false }).limit(50)
    received = data ?? []
  }
  return { type: profile?.account_type, received, given: (given.data ?? []) as AvaliacaoConta[] }
}

export async function guardarNotificacoesConta(form: FormData): Promise<void> {
  const { supabase, user } = await authenticated()
  const { error } = await supabase.from('preferencias_notificacao').upsert({
    user_id: user.id,
    plataforma: form.get('plataforma') === 'on',
    email: form.get('email') === 'on',
    whatsapp: form.get('whatsapp') === 'on',
    atualizada_em: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) redirect('/conta/configuracoes?erro=notificacoes')
  revalidatePath('/conta/configuracoes')
  redirect('/conta/configuracoes?salvo=1')
}

export async function alterarPalavraPasse(form: FormData): Promise<void> {
  const { supabase } = await authenticated(true)
  const password = field(form, 'password')
  const confirmation = field(form, 'confirmation')
  if (password.length < 10 || password.length > 128 || password !== confirmation) redirect('/conta/configuracoes?erro=password')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect('/conta/configuracoes?erro=password')
  redirect('/conta/configuracoes?password=1')
}

export async function terminarTodasSessoes(): Promise<void> {
  const { supabase } = await authenticated(true)
  await supabase.auth.signOut({ scope: 'global' })
  redirect('/login?logout=1')
}

export async function solicitarEliminacaoConta(form: FormData): Promise<void> {
  const { supabase, user } = await authenticated()
  if (field(form, 'confirmacao') !== 'ELIMINAR') redirect('/conta/configuracoes?erro=confirmacao')
  const motivo = field(form, 'motivo')
  if (motivo.length < 10 || motivo.length > 1000) redirect('/conta/configuracoes?erro=motivo')
  const { error } = await supabase.from('admin_messages').insert({
    sender_id: user.id,
    recipient_id: null,
    parent_id: null,
    subject: 'Pedido de eliminação de conta',
    body: 'O utilizador confirmou explicitamente ELIMINAR e solicita a eliminação da sua conta. Motivo: ' + motivo,
  })
  if (error) redirect('/conta/configuracoes?erro=pedido')
  revalidatePath('/conta/configuracoes')
  redirect('/conta/configuracoes?pedido=1')
}
