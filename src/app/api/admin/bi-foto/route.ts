import { createClient } from '@supabase/supabase-js'
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

/** Tipos de conteúdo aceites para a foto de BI. Qualquer outro é recusado. */
const TIPOS_PERMITIDOS = new Set(['application/pdf', 'image/png', 'image/jpeg'])

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

/**
 * Cliente Supabase de serviço. Criado por pedido, só no servidor, sem sessão persistida.
 * Devolve null se SUPABASE_SERVICE_ROLE_KEY ou o URL não estiverem configurados.
 * Nunca é enviado ao cliente nem usado fora desta rota.
 */
function criarClienteServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) return null
  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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

  // 3b. Cliente de serviço configurado? Verifica-se ANTES da RPC, para não registar
  //     auditoria de um pedido que não pode ser entregue.
  const servico = criarClienteServico()
  if (!servico) return semConteudo(500)

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

  // 5. Download com o cliente de serviço, só depois de a RPC ter autorizado e registado o acesso.
  //    A política de storage do admin não cobre fotos de BI, por isso não é usada aqui.
  const { data: ficheiro, error: erroDownload } = await servico.storage
    .from('documentos-privados')
    .download(caminho)

  // O acesso já está registado (foi autorizado). Erros e tipos inválidos não são registados
  // nem detalhados; a resposta é genérica.
  if (erroDownload || !ficheiro || !TIPOS_PERMITIDOS.has(ficheiro.type)) {
    return semConteudo(500)
  }

  // 6. Streaming. Nenhum caminho nem URL é enviado ao browser.
  return new Response(ficheiro.stream(), {
    status: 200,
    headers: {
      ...CABECALHOS_BASE,
      'Content-Type': ficheiro.type,
    },
  })
}
