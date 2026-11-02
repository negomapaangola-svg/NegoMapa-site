/**
 * Validação única de destinos internos (redirectTo, next).
 *
 * Aceita apenas caminhos relativos ao site: começam por "/" e não por "//" nem por "/\".
 * Rejeita caracteres de controlo, barras invertidas em qualquer posição e caminhos /api/.
 * Devolve null quando o destino não é seguro.
 */
const MAX_TAMANHO = 500
// Caracteres de controlo (U+0000 a U+001F, U+007F) e barra invertida.
const CARATERES_PROIBIDOS = /[\u0000-\u001F\u007F\\]/

export function destinoSeguro(valor: string | null | undefined): string | null {
  if (!valor || valor.length > MAX_TAMANHO) return null
  if (CARATERES_PROIBIDOS.test(valor)) return null
  if (!valor.startsWith('/')) return null
  if (valor.startsWith('//')) return null
  if (valor === '/api' || valor.startsWith('/api/')) return null
  return valor
}

/** Destino para redirecionar após login: o destino seguro ou "/". */
export function redirectSeguro(valor: string | null | undefined): string {
  return destinoSeguro(valor) ?? '/'
}
