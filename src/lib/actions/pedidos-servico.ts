'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { PROVINCIAS_ANGOLA } from '@/lib/listas-selecao'

export type PedidoServico = {
  id: string
  titulo: string
  descricao: string
  provincia: string
  data_preferida: string | null
  orcamento: number | null
  contacto: string
  estado: 'novo' | 'em_analise' | 'aceite' | 'recusado' | 'concluido' | 'cancelado' | string
  criada_em: string
}

export type ResultadoPedido = { success: boolean; error?: string }

const ESTADOS_CANCELAVEIS = ['novo', 'em_analise'] as const
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ServicoParaPedido = {
  servico_id: string
  profissional_id: string
  titulo_servico: string
  nome_profissional: string
}

/**
 * Valida o serviço e o profissional indicados na página de serviço, antes de pré-preencher /pedidos.
 * Só devolve dados quando o serviço está aprovado e pertence ao profissional indicado, também aprovado.
 */
export async function obterServicoParaPedido(
  servicoId: string,
  profissionalId: string
): Promise<ServicoParaPedido | null> {
  if (!UUID_REGEX.test(servicoId) || !UUID_REGEX.test(profissionalId)) return null

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('servicos')
    .select('id, titulo, profissional_id, profissional:profissional_id(nome, estado)')
    .eq('id', servicoId)
    .eq('estado', 'aprovado')
    .maybeSingle()

  if (error || !data) return null
  if (data.profissional_id !== profissionalId) return null

  const embed = data.profissional as unknown
  const profissional = (Array.isArray(embed) ? embed[0] : embed) as { nome: string; estado: string } | null
  if (!profissional || profissional.estado !== 'aprovado') return null

  return {
    servico_id: data.id,
    profissional_id: profissionalId,
    titulo_servico: data.titulo,
    nome_profissional: profissional.nome,
  }
}

export async function listarMeusPedidos(): Promise<{ success: true; data: PedidoServico[] } | { success: false; error: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const { data, error } = await supabase
    .from('pedidos_servico')
    .select('id, titulo, descricao, provincia, data_preferida, orcamento, contacto, estado, criada_em')
    .eq('cliente_id', user.id)
    .order('criada_em', { ascending: false })

  if (error) {
    console.error('Erro ao listar pedidos. Código:', error.code)
    return { success: false, error: 'Não foi possível carregar os pedidos.' }
  }

  return { success: true, data: (data ?? []) as PedidoServico[] }
}

export async function criarPedido(formData: FormData): Promise<ResultadoPedido> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  const titulo = String(formData.get('titulo') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()
  const provincia = String(formData.get('provincia') ?? '').trim()
  const dataPreferida = String(formData.get('data_preferida') ?? '').trim()
  const orcamentoTexto = String(formData.get('orcamento') ?? '').trim()
  const contacto = String(formData.get('contacto') ?? '').trim()
  const servicoId = String(formData.get('servico_id') ?? '').trim()
  const profissionalId = String(formData.get('profissional_id') ?? '').trim()

  if (servicoId && !profissionalId) {
    return { success: false, error: 'Um pedido de serviço tem de indicar o profissional.' }
  }
  if (profissionalId && !UUID_REGEX.test(profissionalId)) {
    return { success: false, error: 'Profissional inválido.' }
  }
  if (servicoId && !UUID_REGEX.test(servicoId)) {
    return { success: false, error: 'Serviço inválido.' }
  }

  if (titulo.length < 3 || titulo.length > 200) {
    return { success: false, error: 'O título deve ter entre 3 e 200 caracteres.' }
  }
  if (descricao.length < 10 || descricao.length > 2000) {
    return { success: false, error: 'A descrição deve ter entre 10 e 2000 caracteres.' }
  }
  if (!(PROVINCIAS_ANGOLA as readonly string[]).includes(provincia)) {
    return { success: false, error: 'Selecione uma província válida.' }
  }
  if (dataPreferida && !DATA_REGEX.test(dataPreferida)) {
    return { success: false, error: 'A data preferida não é válida.' }
  }
  let orcamento: number | null = null
  if (orcamentoTexto) {
    orcamento = Number(orcamentoTexto.replace(',', '.'))
    if (!Number.isFinite(orcamento) || orcamento < 0) {
      return { success: false, error: 'O orçamento deve ser um valor positivo.' }
    }
  }
  if (contacto.length < 3 || contacto.length > 120) {
    return { success: false, error: 'Indique um contacto (entre 3 e 120 caracteres).' }
  }

  const { error } = await supabase.from('pedidos_servico').insert({
    cliente_id: user.id,
    titulo,
    descricao,
    provincia,
    data_preferida: dataPreferida || null,
    orcamento,
    contacto,
    estado: 'novo',
    // Validados pela RLS e pelo trigger validar_servico_pedido (profissional e serviço aprovados e ligados).
    profissional_id: profissionalId || null,
    servico_id: servicoId || null,
  })

  if (error) {
    console.error('Erro ao criar pedido. Código:', error.code)
    return { success: false, error: 'Não foi possível enviar o pedido. Tente novamente.' }
  }

  revalidatePath('/pedidos')
  return { success: true }
}

export async function cancelarPedido(pedidoId: string): Promise<ResultadoPedido> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sessão expirada. Inicie sessão novamente.' }

  // A RLS e o trigger também garantem estes limites; o filtro aqui evita um erro confuso.
  const { data, error } = await supabase
    .from('pedidos_servico')
    .update({ estado: 'cancelado' })
    .eq('id', pedidoId)
    .eq('cliente_id', user.id)
    .in('estado', [...ESTADOS_CANCELAVEIS])
    .select('id')

  if (error) {
    console.error('Erro ao cancelar pedido. Código:', error.code)
    return { success: false, error: 'Não foi possível cancelar o pedido.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'Só é possível cancelar pedidos novos ou em análise.' }
  }

  revalidatePath('/pedidos')
  return { success: true }
}
