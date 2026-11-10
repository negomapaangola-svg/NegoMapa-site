'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export type PedidoProfissional = {
  id: string
  titulo: string
  descricao: string
  provincia: string
  data_preferida: string | null
  orcamento: number | null
  contacto: string
  estado: string
  criada_em: string
  /** Estados para os quais o profissional pode mover este pedido (calculado no servidor). */
  acoes: string[]
}

export type ResultadoPedidoProfissional = { success: boolean; error?: string }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Transições que o profissional pode pedir, por estado atual.
 * A validação definitiva é feita pelo trigger validar_transicao_pedido.
 * Cancelar novo ou em_analise não está incluído: o trigger só o permite ao cliente.
 */
const TRANSICOES_PROFISSIONAL: Record<string, string[]> = {
  novo: ['em_analise', 'aceite', 'recusado'],
  em_analise: ['aceite', 'recusado'],
  aceite: ['concluido', 'cancelado'],
}

export async function listarPedidosDoProfissional(): Promise<
  { success: true; data: PedidoProfissional[] } | { success: false; error: string }
> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const { data: perfil, error: erroPerfil } = await supabase
    .from('profissionais')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (erroPerfil) {
    console.error('Erro ao verificar perfil profissional. Código:', erroPerfil.code)
    return { success: false, error: 'Não foi possível carregar os pedidos.' }
  }
  if (!perfil) return { success: true, data: [] }

  const { data, error } = await supabase
    .from('pedidos_servico')
    .select('id, titulo, descricao, provincia, data_preferida, orcamento, contacto, estado, criada_em')
    .eq('profissional_id', perfil.id)
    .order('criada_em', { ascending: false })

  if (error) {
    console.error('Erro ao listar pedidos do profissional. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar os pedidos.' }
  }

  const pedidos: PedidoProfissional[] = (data ?? []).map((pedido) => ({
    ...(pedido as Omit<PedidoProfissional, 'acoes'>),
    acoes: TRANSICOES_PROFISSIONAL[pedido.estado] ?? [],
  }))

  return { success: true, data: pedidos }
}

export async function atualizarEstadoPedidoProfissional(
  pedidoId: string,
  novoEstado: string
): Promise<ResultadoPedidoProfissional> {
  if (!UUID_REGEX.test(pedidoId)) return { success: false, error: 'Pedido inválido.' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const { data: perfil, error: erroPerfil } = await supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle()
  if (erroPerfil || !perfil) return { success: false, error: 'Perfil profissional não encontrado.' }

  const { data: atual, error: erroLeitura } = await supabase
    .from('pedidos_servico')
    .select('id, estado, profissional_id')
    .eq('id', pedidoId)
    .maybeSingle()

  if (erroLeitura) {
    console.error('Erro ao ler pedido. Código:', erroLeitura.code)
    return { success: false, error: 'Não foi possível atualizar o pedido.' }
  }
  if (!atual || atual.profissional_id !== perfil.id) return { success: false, error: 'Pedido não encontrado ou sem permissão.' }

  const permitidos = TRANSICOES_PROFISSIONAL[atual.estado] ?? []
  if (!permitidos.includes(novoEstado)) {
    return { success: false, error: 'Esta alteração não é permitida para o estado atual do pedido.' }
  }

  // O filtro pelo estado lido evita sobrepor uma alteração feita entretanto.
  const { data, error } = await supabase
    .from('pedidos_servico')
    .update({ estado: novoEstado })
    .eq('id', pedidoId)
    .eq('profissional_id', perfil.id)
    .eq('estado', atual.estado)
    .select('id')

  if (error) {
    console.error('Erro ao atualizar estado do pedido. Código:', error.code)
    return { success: false, error: 'Não foi possível atualizar o pedido.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'O pedido foi alterado entretanto. Atualize a página.' }
  }

  revalidatePath('/profissional/painel/pedidos')
  return { success: true }
}
