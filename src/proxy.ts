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

  const path = request.nextUrl.pathname
  if (path === '/escolher-tipo' || path.startsWith('/auth') || path.startsWith('/api') || path === '/logout') {
    return supabaseResponse
  }

  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .maybeSingle()

  // Em caso de falha temporária de leitura, não redirecciona nem altera a sessão.
  if (error || perfil?.account_type) return supabaseResponse

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
