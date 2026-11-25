import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { destinoSeguro } from '@/lib/redirect-seguro'

// Recebe o link do email de confirmação, troca o código por sessão
// e redirecciona para a escolha do tipo de conta quando o perfil ainda
// não tem um tipo definido.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')
  const safeNext = nextParam === null ? '/escolher-tipo' : (destinoSeguro(nextParam) ?? '/escolher-tipo')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', data.user.id)
        .maybeSingle()

      const destino = perfil?.account_type ? safeNext : '/escolher-tipo'
      return NextResponse.redirect(new URL(destino, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?erro=confirmacao', origin))
}
