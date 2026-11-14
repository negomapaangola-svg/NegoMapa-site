import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return supabaseResponse

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(values) {
        values.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return supabaseResponse

  const { data: perfil, error: profileError } = await supabase
    .from('profiles')
    .select('account_type,is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!profileError && perfil?.is_active === false) {
    await supabase.auth.signOut({ scope: 'local' })
    const destino = request.nextUrl.clone()
    destino.pathname = '/login'
    destino.search = '?erro=conta-desactivada'
    const resposta = NextResponse.redirect(destino)
    supabaseResponse.cookies.getAll().forEach(cookie => resposta.cookies.set(cookie))
    return resposta
  }

  let accountType = perfil?.account_type ?? null
  if (profileError?.code === '42703') {
    // Compatibilidade temporária com ambientes onde a migração ainda não foi aplicada.
    const { data: perfilLegado, error: legacyError } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .maybeSingle()
    if (legacyError) return supabaseResponse
    accountType = perfilLegado?.account_type ?? null
  } else if (profileError) {
    // Não alterar sessões por falhas transitórias de leitura.
    return supabaseResponse
  }

  const path = request.nextUrl.pathname
  if (path === '/escolher-tipo' || path.startsWith('/auth') || path.startsWith('/api') || path === '/logout') {
    return supabaseResponse
  }

  if (accountType) return supabaseResponse

  const destino = request.nextUrl.clone()
  destino.pathname = '/escolher-tipo'
  destino.search = ''
  const resposta = NextResponse.redirect(destino)
  supabaseResponse.cookies.getAll().forEach(cookie => resposta.cookies.set(cookie))
  return resposta
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
