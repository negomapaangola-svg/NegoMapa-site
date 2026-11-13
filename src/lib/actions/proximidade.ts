'use server'

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type TipoPrestador = 'profissional' | 'empresa'
type TipoResultado = TipoPrestador | 'servico' | 'produto'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function contexto() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: perfil, error: perfilError } = await supabase
    .from('profiles')
    .select('account_type,consentimento_localizacao,latitude_aproximada,longitude_aproximada')
    .eq('id', user.id)
    .maybeSingle()
  if (perfilError || !perfil) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return {
    user,
    perfil,
    admin: createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }),
  }
}

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100
}

function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (graus: number) => graus * Math.PI / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/** Grava apenas coordenadas arredondadas do local de atendimento, nunca uma morada. */
export async function guardarLocalizacaoPrestador(tipo: TipoPrestador, entidadeId: string, latitude: unknown, longitude: unknown) {
  try {
    const ctx = await contexto()
    if (!ctx) return { ok: false, message: 'Sessão ou configuração indisponível.' }
    if (!UUID.test(entidadeId) || (tipo !== 'profissional' && tipo !== 'empresa')) {
      return { ok: false, message: 'Perfil inválido.' }
    }
    const lat = Number(latitude)
    const lon = Number(longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return { ok: false, message: 'A localização recebida não é válida.' }
    }

    const tabela = tipo === 'profissional' ? 'profissionais' : 'companies'
    const { data: dono, error: donoError } = await ctx.admin.from(tabela)
      .select('id').eq('id', entidadeId).eq('user_id', ctx.user.id).maybeSingle()
    if (donoError || !dono) return { ok: false, message: 'Só o proprietário pode actualizar esta localização.' }

    const { error } = await ctx.admin.from(tabela).update({
      latitude_aproximada: arredondar(lat),
      longitude_aproximada: arredondar(lon),
    }).eq('id', entidadeId).eq('user_id', ctx.user.id)
    if (error) return { ok: false, message: 'Não foi possível guardar a localização aproximada.' }
    return { ok: true, message: 'Localização aproximada do local de atendimento guardada.' }
  } catch {
    return { ok: false, message: 'Não foi possível guardar a localização aproximada.' }
  }
}

export async function removerLocalizacaoPrestador(tipo: TipoPrestador, entidadeId: string) {
  try {
    const ctx = await contexto()
    if (!ctx || !UUID.test(entidadeId) || (tipo !== 'profissional' && tipo !== 'empresa')) {
      return { ok: false, message: 'Sessão ou perfil inválido.' }
    }
    const tabela = tipo === 'profissional' ? 'profissionais' : 'companies'
    const { data: dono } = await ctx.admin.from(tabela).select('id')
      .eq('id', entidadeId).eq('user_id', ctx.user.id).maybeSingle()
    if (!dono) return { ok: false, message: 'Só o proprietário pode remover esta localização.' }
    const { error } = await ctx.admin.from(tabela).update({
      latitude_aproximada: null,
      longitude_aproximada: null,
    }).eq('id', entidadeId).eq('user_id', ctx.user.id)
    if (error) return { ok: false, message: 'Não foi possível remover a localização.' }
    return { ok: true, message: 'Localização aproximada removida.' }
  } catch {
    return { ok: false, message: 'Não foi possível remover a localização.' }
  }
}

/**
 * Devolve exclusivamente distâncias arredondadas, nunca coordenadas.
 * A leitura privilegiada só ocorre para clientes autenticados com consentimento activo.
 */
export async function obterDistanciasAproximadas(tipo: TipoResultado, idsRecebidos: string[]): Promise<Record<string, number>> {
  try {
    const ctx = await contexto()
    if (!ctx || ctx.perfil.account_type !== 'cliente' || ctx.perfil.consentimento_localizacao !== true) return {}
    const latCliente = Number(ctx.perfil.latitude_aproximada)
    const lonCliente = Number(ctx.perfil.longitude_aproximada)
    if (!Number.isFinite(latCliente) || !Number.isFinite(lonCliente)) return {}

    const ids = [...new Set((Array.isArray(idsRecebidos) ? idsRecebidos : []).filter((id) => typeof id === 'string' && UUID.test(id)))].slice(0, 1000)
    if (!ids.length) return {}

    const origemPorId = new Map<string, string>()
    let idsPrestadores = ids
    let tipoPrestador: TipoPrestador = tipo === 'empresa' || tipo === 'produto' ? 'empresa' : 'profissional'

    if (tipo === 'servico') {
      const { data } = await ctx.admin.from('servicos').select('id,profissional_id')
        .in('id', ids).eq('estado', 'aprovado')
      for (const row of data ?? []) origemPorId.set(row.id, row.profissional_id)
      idsPrestadores = [...new Set([...origemPorId.values()])]
    } else if (tipo === 'produto') {
      const { data } = await ctx.admin.from('produtos').select('id,company_id')
        .in('id', ids).eq('estado_aprovacao', 'aprovado')
      for (const row of data ?? []) origemPorId.set(row.id, row.company_id)
      idsPrestadores = [...new Set([...origemPorId.values()])]
    }

    if (!idsPrestadores.length) return {}
    const tabela = tipoPrestador === 'empresa' ? 'companies' : 'profissionais'
    let query = ctx.admin.from(tabela).select('id,latitude_aproximada,longitude_aproximada').in('id', idsPrestadores)
    query = tipoPrestador === 'empresa' ? query.eq('is_approved', true) : query.eq('estado', 'aprovado')
    const { data: prestadores, error } = await query
    if (error || !prestadores) return {}

    const distanciasPrestador = new Map<string, number>()
    for (const row of prestadores) {
      const lat = Number(row.latitude_aproximada)
      const lon = Number(row.longitude_aproximada)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
      distanciasPrestador.set(row.id, distanciaKm(latCliente, lonCliente, lat, lon))
    }

    const resultado: Record<string, number> = {}
    for (const id of ids) {
      const idPrestador = origemPorId.get(id) ?? id
      const distancia = distanciasPrestador.get(idPrestador)
      if (distancia !== undefined) resultado[id] = distancia
    }
    return resultado
  } catch {
    return {}
  }
}
