'use server'

import { obterContextoUtilizador } from '@/lib/permissoes'

export async function obterContextoNavegacao() {
  const contexto = await obterContextoUtilizador()
  return {
    autenticado: contexto.autenticado,
    profissional: contexto.profissional,
    estadoProfissional: contexto.estadoProfissional,
    empresa: contexto.empresa,
    empresaAprovada: contexto.empresaAprovada,
    administrador: contexto.administrador,
    accountType: contexto.accountType,
  }
}
