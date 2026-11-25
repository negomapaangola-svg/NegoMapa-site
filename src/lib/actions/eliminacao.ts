'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUserCompany } from '@/lib/actions/vagas'
import type { ActionResult } from '@/lib/actions/vagas'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function idValido(valor: string) {
  return UUID_REGEX.test(valor)
}

async function obterEmpresaAutorizada(companyId: string) {
  if (!idValido(companyId)) return null
  return getUserCompany(companyId)
}

export async function eliminarVaga(vagaId: string, companyId: string): Promise<ActionResult> {
  if (!idValido(vagaId)) return { success: false, error: 'Vaga inválida.' }
  const company = await obterEmpresaAutorizada(companyId)
  if (!company) return { success: false, error: 'Empresa não encontrada ou sem permissão.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('vagas')
    .delete()
    .eq('id', vagaId)
    .eq('company_id', company.id)

  if (error) {
    console.error('Erro ao eliminar vaga:', error)
    return { success: false, error: 'Não foi possível eliminar a vaga. Tente novamente.' }
  }

  revalidatePath('/empresa/painel/vagas')
  revalidatePath('/vagas')
  return { success: true }
}

export async function eliminarServico(servicoId: string, companyId: string): Promise<ActionResult> {
  if (!idValido(servicoId)) return { success: false, error: 'Serviço inválido.' }
  const company = await obterEmpresaAutorizada(companyId)
  if (!company) return { success: false, error: 'Empresa não encontrada ou sem permissão.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('servicos')
    .delete()
    .eq('id', servicoId)
    .eq('company_id', company.id)

  if (error) {
    console.error('Erro ao eliminar serviço:', error)
    return { success: false, error: 'Não foi possível eliminar o serviço. Tente novamente.' }
  }

  revalidatePath('/empresa/painel/conteudos')
  revalidatePath('/servicos')
  return { success: true }
}

export async function eliminarProduto(produtoId: string, companyId: string): Promise<ActionResult> {
  if (!idValido(produtoId)) return { success: false, error: 'Produto inválido.' }
  const company = await obterEmpresaAutorizada(companyId)
  if (!company) return { success: false, error: 'Empresa não encontrada ou sem permissão.' }

  const supabase = await createSupabaseServerClient()
  const { error: imagensError } = await supabase
    .from('produto_imagens')
    .delete()
    .eq('produto_id', produtoId)

  if (imagensError) {
    console.error('Erro ao eliminar imagens do produto:', imagensError)
    return { success: false, error: 'Não foi possível eliminar as imagens do produto.' }
  }

  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', produtoId)
    .eq('company_id', company.id)

  if (error) {
    console.error('Erro ao eliminar produto:', error)
    return { success: false, error: 'Não foi possível eliminar o produto. Tente novamente.' }
  }

  revalidatePath('/empresa/painel/conteudos')
  revalidatePath('/produto')
  return { success: true }
}

export async function eliminarEmpresa(companyId: string): Promise<ActionResult> {
  const company = await obterEmpresaAutorizada(companyId)
  if (!company) return { success: false, error: 'Empresa não encontrada ou sem permissão.' }

  const supabase = await createSupabaseServerClient()

  const { data: conversas } = await supabase
    .from('conversas')
    .select('id')
    .eq('empresa_id', company.id)
  const conversaIds = (conversas ?? []).map((item) => item.id)

  if (conversaIds.length > 0) {
    await supabase.from('mensagens').delete().in('conversa_id', conversaIds)
  }
  await supabase.from('conversas').delete().eq('empresa_id', company.id)

  const { data: vagas } = await supabase.from('vagas').select('id').eq('company_id', company.id)
  const vagaIds = (vagas ?? []).map((item) => item.id)

  if (vagaIds.length > 0) {
    await supabase.from('candidaturas').delete().in('vaga_id', vagaIds)
    await supabase.from('avaliacoes').delete().in('vaga_id', vagaIds)
    await supabase.from('denuncias').delete().in('vaga_id', vagaIds)
  }

  const { data: servicos } = await supabase.from('servicos').select('id').eq('company_id', company.id)
  const servicoIds = (servicos ?? []).map((item) => item.id)

  if (servicoIds.length > 0) {
    await supabase.from('pedidos_servico').delete().in('servico_id', servicoIds)
    await supabase.from('avaliacoes').delete().in('servico_id', servicoIds)
    await supabase.from('denuncias').delete().in('servico_id', servicoIds)
  }

  const { data: produtos } = await supabase.from('produtos').select('id').eq('company_id', company.id)
  const produtoIds = (produtos ?? []).map((item) => item.id)

  if (produtoIds.length > 0) {
    await supabase.from('produto_imagens').delete().in('produto_id', produtoIds)
  }

  await supabase.from('avaliacoes').delete().eq('company_id', company.id)
  await supabase.from('denuncias').delete().eq('company_id', company.id)
  await supabase.from('servicos').delete().eq('company_id', company.id)
  await supabase.from('produtos').delete().eq('company_id', company.id)
  await supabase.from('vagas').delete().eq('company_id', company.id)

  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', company.id)
    .eq('user_id', user?.id ?? '')

  if (error) {
    console.error('Erro ao eliminar empresa:', error)
    return { success: false, error: 'Não foi possível eliminar a empresa porque existem registos associados.' }
  }

  revalidatePath('/empresa/painel')
  revalidatePath('/empresas')
  revalidatePath('/vagas')
  revalidatePath('/servicos')
  redirect('/empresa/painel')
}
