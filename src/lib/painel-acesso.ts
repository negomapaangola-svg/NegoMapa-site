/**
 * Regras puras de acesso aos painéis (/painel/empresa e /painel/profissional).
 * Sem dependências de Next.js ou Supabase, para poderem ser testadas isoladamente.
 */

export type TipoPainel = 'empresa' | 'profissional'

/**
 * Um utilizador é empresa se tiver linha em companies; é profissional se tiver
 * linha em profissionais. Não existindo nenhuma, ou existindo as duas, não há
 * tipo inequívoco e devolve-se null (o servidor não escolhe um painel por ele).
 */
export function tipoDoUtilizador(temEmpresa: boolean, temProfissional: boolean): TipoPainel | null {
  if (temEmpresa && !temProfissional) return 'empresa'
  if (temProfissional && !temEmpresa) return 'profissional'
  return null
}

/** Caminho base do painel de cada tipo. */
export function caminhoPainel(tipo: TipoPainel): string {
  return `/painel/${tipo}`
}

/** Só aceita caminhos internos simples, para evitar redirecionamentos externos. */
export function caminhoLogin(caminhoDestino: string): string {
  return `/login?redirectTo=${encodeURIComponent(caminhoDestino)}`
}
