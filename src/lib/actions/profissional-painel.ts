'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export type PerfilProfissionalProprio = {
  id: string
  estado: string
}

/**
 * Devolve o perfil de profissional do utilizador autenticado, ou null.
 * A RLS de profissionais permite ao próprio dono ler a sua linha, em qualquer estado.
 */
export async function obterPerfilProfissionalDoUtilizador(): Promise<PerfilProfissionalProprio | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profissionais')
    .select('id, estado')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Erro ao obter perfil de profissional. Código:', error.code)
    return null
  }

  return (data ?? null) as PerfilProfissionalProprio | null
}


export type DadosCadastroProfissional = {
  nome: string
  provincia: string
  municipio: string
  bairro: string
  categoriaId: string
  especialidades: string
  descricao: string
  experiencia: string
  precoFaixa: string
  disponibilidade: string
  telefone: string
  whatsapp: string
}

export type ResultadoCadastroProfissional = { success: boolean; error?: string }

const UUID_CATEGORIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EXPERIENCIAS_VALIDAS = ['menos_1', '1_3', '3_5', 'mais_5']
const DISPONIBILIDADES_VALIDAS = ['disponivel', 'ocupado', 'indisponivel']

function slugCadastroProfissional(nome: string, userId: string): string {
  const base = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profissional'
  return `${base}-${userId.slice(0, 8)}`
}

export async function criarPerfilProfissional(dados: DadosCadastroProfissional): Promise<ResultadoCadastroProfissional> {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: erroAuth } = await supabase.auth.getUser()
  if (erroAuth || !user) return { success: false, error: 'A sessão expirou. Inicie sessão novamente.' }
  if (!dados || typeof dados !== 'object') return { success: false, error: 'Os dados enviados são inválidos.' }

  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : ''
  const provincia = typeof dados.provincia === 'string' ? dados.provincia.trim() : ''
  const municipio = typeof dados.municipio === 'string' ? dados.municipio.trim() : ''
  const bairro = typeof dados.bairro === 'string' ? dados.bairro.trim() : ''
  const telefone = typeof dados.telefone === 'string' ? dados.telefone.trim() : ''
  const whatsapp = typeof dados.whatsapp === 'string' ? dados.whatsapp.trim() : ''
  const descricao = typeof dados.descricao === 'string' ? dados.descricao.trim() : ''
  const experiencia = typeof dados.experiencia === 'string' ? dados.experiencia : ''
  const precoFaixa = typeof dados.precoFaixa === 'string' ? dados.precoFaixa.trim() : ''
  const disponibilidade = typeof dados.disponibilidade === 'string' ? dados.disponibilidade : ''
  const especialidadesTexto = typeof dados.especialidades === 'string' ? dados.especialidades : ''

  if (nome.length < 2 || nome.length > 120) return { success: false, error: 'Indique um nome entre 2 e 120 caracteres.' }
  if (!provincia || provincia.length > 80) return { success: false, error: 'Seleccione uma província válida.' }
  if (!municipio || municipio.length > 100) return { success: false, error: 'Indique um município válido.' }
  if (bairro.length > 120) return { success: false, error: 'O bairro não pode exceder 120 caracteres.' }
  if (!UUID_CATEGORIA.test(dados.categoriaId ?? '')) return { success: false, error: 'Seleccione uma categoria válida.' }
  if (!EXPERIENCIAS_VALIDAS.includes(experiencia)) return { success: false, error: 'Seleccione uma faixa de experiência válida.' }
  if (telefone.length < 5 || telefone.length > 32) return { success: false, error: 'Indique um telefone válido.' }
  if (whatsapp.length < 5 || whatsapp.length > 32) return { success: false, error: 'Indique um WhatsApp válido.' }
  if (descricao.length > 2000) return { success: false, error: 'A descrição não pode exceder 2.000 caracteres.' }
  if (disponibilidade && !DISPONIBILIDADES_VALIDAS.includes(disponibilidade)) return { success: false, error: 'Seleccione uma disponibilidade válida.' }
  if (precoFaixa && (!/^\d+(?:\.\d+)?$/.test(precoFaixa) || Number(precoFaixa) < 0)) return { success: false, error: 'Seleccione uma faixa de preço válida.' }

  const especialidades = especialidadesTexto.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20)
  if (especialidades.some((item) => item.length > 80)) return { success: false, error: 'Cada especialidade deve ter até 80 caracteres.' }

  const { data: categoria, error: erroCategoria } = await supabase
    .from('categorias')
    .select('id')
    .eq('id', dados.categoriaId)
    .eq('ativo', true)
    .maybeSingle()
  if (erroCategoria || !categoria) {
    if (erroCategoria) console.error('Erro ao validar categoria do cadastro. Código:', erroCategoria.code)
    return { success: false, error: 'A categoria seleccionada não está disponível. Actualize a página e tente novamente.' }
  }

  const { data: existente, error: erroExistente } = await supabase
    .from('profissionais')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (erroExistente) {
    console.error('Erro ao verificar perfil profissional existente. Código:', erroExistente.code)
    return { success: false, error: 'Não foi possível verificar o seu perfil. Tente novamente.' }
  }
  if (existente) return { success: false, error: 'Já existe um perfil profissional associado a esta conta.' }

  const { error } = await supabase.from('profissionais').insert({
    user_id: user.id,
    nome,
    slug: slugCadastroProfissional(nome, user.id),
    provincia,
    municipio,
    bairro: bairro || null,
    categoria_id: categoria.id,
    especialidades,
    bio: descricao || null,
    experiencia_faixa: experiencia,
    faixa_preco_desde: precoFaixa || null,
    disponibilidade: disponibilidade || null,
    telefone,
    whatsapp,
    estado: 'pendente',
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Já existe um perfil profissional associado a esta conta.' }
    if (error.code === '42501') {
      console.error('Permissão recusada ao criar perfil profissional. Código:', error.code)
      return { success: false, error: 'Não foi possível guardar o cadastro com as permissões actuais. Contacte o suporte.' }
    }
    console.error('Erro ao criar perfil profissional. Código:', error.code)
    return { success: false, error: 'Não foi possível guardar o cadastro. Tente novamente.' }
  }

  revalidatePath('/cadastrar-profissional')
  revalidatePath('/profissional/painel')
  return { success: true }
}
