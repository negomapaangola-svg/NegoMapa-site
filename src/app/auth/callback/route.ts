import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { destinoSeguro } from '@/lib/redirect-seguro'

// Recebe o link do email de confirmação, troca o código por sessão
// e redirecciona para a página pedida (por defeito, o cadastro de empresa).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Sem parâmetro next: destino por defeito. Com next inválido: "/".
  const nextParam = searchParams.get('next')
  const safeNext = nextParam === null ? '/cadastrar-empresa' : (destinoSeguro(nextParam) ?? '/')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?erro=confirmacao', origin))
}
