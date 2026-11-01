import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Foto do BI de um profissional pendente, entregue por streaming ao administrador.
 *
 * - O caminho do ficheiro e qualquer URL assinado ficam apenas no servidor.
 * - Cada pedido é autorizado de novo (sessão, is_admin, estado pendente, foto presente).
 * - Cada pedido autorizado gera uma linha em admin_acessos_bi, incluindo repetidos.
 * - Pedidos negados não geram linha.
 * - Não há logs de corpo, identificadores, caminhos ou erros do Supabase.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CABECALHOS_BASE = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Disposition': 'inline',
}

/** Resposta sem corpo: não revela detalhes do erro. */
function semConteudo(status: number): Response {
  return new Response(null, { status, headers: CABECALHOS_BASE })
}

export async function POST(request: Request): Promise<Response> {
  // 1. Origem: o pedido tem de vir da própria aplicação.
  const origem = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origem || !host) return semConteudo(403)
  try {
    if (new URL(origem).host !== host) return semConteudo(403)
  } catch {
    return semConteudo(403)
  }

  // 2. Corpo: um UUID válido.
  let profissionalId: unknown
  try {
    const corpo = (await request.json()) as { profissionalId?: unknown }
    profissionalId = corpo?.profissionalId
  } catch {
    return semConteudo(400)
  }
  if (typeof profissionalId !== 'string' || !UUID_RE.test(profissionalId)) {
    return semConteudo(400)
  }

  // 3. Sessão. Sem utilizador não há identidade para auditar.
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return semConteudo(401)

  // 4. Autorização e auditoria. A RPC só regista o acesso depois de todas as verificações.
  const { data: caminho, error } = await supabase.rpc('admin_registar_acesso_bi_foto', {
    p_id: profissionalId,
  })

  if (error) {
    // Só o código do erro: a mensagem pode conter dados sensíveis.
    if (error.code === '42501') return semConteudo(403)
    if (error.code === 'P0002') return semConteudo(404)
    return semConteudo(500)
  }

  if (typeof caminho !== 'string' || caminho.length === 0) {
    return semConteudo(404)
  }

  // 5. Download com a sessão do administrador: a RLS de storage aplica-se ao próprio download.
  const { data: ficheiro, error: erroDownload } = await supabase.storage
    .from('documentos-privados')
    .download(caminho)

  if (erroDownload || !ficheiro) {
    // O acesso já está registado (foi autorizado). Não se regista o erro nem o caminho.
    return semConteudo(500)
  }

  // 6. Streaming. Nenhum caminho nem URL é enviado ao browser.
  return new Response(ficheiro.stream(), {
    status: 200,
    headers: {
      ...CABECALHOS_BASE,
      'Content-Type': ficheiro.type || 'application/octet-stream',
    },
  })
}
