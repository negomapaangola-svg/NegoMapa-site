import 'server-only'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'

export type ContextoUtilizador = {
  autenticado: boolean
  userId: string | null
  profissional: boolean
  estadoProfissional: string | null
  empresa: boolean
  empresaAprovada: boolean
  administrador: boolean
  accountType: string | null
  contaAtiva: boolean
}

export async function obterContextoUtilizador(): Promise<ContextoUtilizador> {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { autenticado: false, userId: null, profissional: false, estadoProfissional: null, empresa: false, empresaAprovada: false, administrador: false, accountType: null, contaAtiva: false }
  }

  const [profissionalResult, empresaResult, perfilResult, administrador] = await Promise.all([
    supabase.from('profissionais').select('id, estado').eq('user_id', user.id).maybeSingle(),
    supabase.from('companies').select('id, is_approved, estado').eq('user_id', user.id),
    supabase.from('profiles').select('account_type, is_active').eq('id', user.id).maybeSingle(),
    isAdmin(),
  ])

  const tipo = perfilResult.error ? null : perfilResult.data?.account_type ?? null
  const profissional = profissionalResult.error ? null : profissionalResult.data
  const empresas = empresaResult.error ? [] : empresaResult.data ?? []
  // profiles.account_type é a fonte de verdade. Registos empresariais/profissionais
  // legados não convertem uma conta cliente noutro papel.
  // O papel administrativo é mutuamente exclusivo, conforme a matriz da Fase 6.
  const eProfissional = !administrador && tipo === 'profissional' && Boolean(profissional)
  const eEmpresa = !administrador && tipo === 'empresa' && empresas.length > 0
  return {
    autenticado: true,
    userId: user.id,
    profissional: eProfissional,
    estadoProfissional: eProfissional ? profissional?.estado ?? null : null,
    empresa: eEmpresa,
    empresaAprovada: eEmpresa && empresas.some((empresa) => empresa.is_approved === true && (empresa.estado === 'aprovado' || empresa.estado === null)),
    administrador,
    accountType: administrador ? null : tipo,
    contaAtiva: perfilResult.data?.is_active === true,
  }
}

export const eVisitante = (c: ContextoUtilizador) => !c.autenticado
export const eAutenticado = (c: ContextoUtilizador) => c.autenticado
export const eProfissional = (c: ContextoUtilizador) => c.autenticado && c.profissional
export const eProfissionalAprovado = (c: ContextoUtilizador) => c.contaAtiva && c.accountType === 'profissional' && eProfissional(c) && c.estadoProfissional === 'aprovado'
export const eEmpresa = (c: ContextoUtilizador) => c.autenticado && c.empresa
export const eEmpresaAprovada = (c: ContextoUtilizador) => c.contaAtiva && c.accountType === 'empresa' && eEmpresa(c) && c.empresaAprovada
export const eAdministrador = (c: ContextoUtilizador) => c.autenticado && c.administrador
export const podePublicarServico = (c: ContextoUtilizador) => eProfissionalAprovado(c) || eEmpresaAprovada(c)
export const podePublicarVaga = eEmpresaAprovada
export const podePublicarProduto = eEmpresaAprovada
export const podeAcederPainelProfissional = eProfissional
export const podeAcederPainelEmpresa = eEmpresa
export const podeAcederAdministracao = eAdministrador
