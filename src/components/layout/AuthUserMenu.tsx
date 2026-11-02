'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/Button'
import { logoutAction } from '@/lib/actions/logout'
import { checkIsAdmin } from '@/lib/actions/admin'

/**
 * Ações de conta.
 * - 'cabecalho': linha horizontal (desktop).
 * - 'lista': coluna de botões grandes (menu do telemóvel).
 */
export function AuthUserMenu({ variante = 'cabecalho' }: { variante?: 'cabecalho' | 'lista' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const lista = variante === 'lista'

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      if (session) {
        const adminResult = await checkIsAdmin()
        setIsAdmin(adminResult)
      }
      setIsLoading(false)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
      if (session) {
        checkIsAdmin().then(setIsAdmin)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return null
  }

  const classeLink = lista
    ? 'flex min-h-12 items-center rounded-md px-3 text-base font-medium text-navy hover:bg-cream hover:text-orange-500 dark:text-cream dark:hover:bg-white/5 dark:hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
    : 'text-sm font-medium text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 px-3 py-2 rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2'
  const classeContentor = lista ? 'flex flex-col gap-1' : 'flex items-center gap-3'

  if (!isAuthenticated) {
    return (
      <div className={classeContentor}>
        <Link href="/login" className={classeLink}>
          Entrar
        </Link>
        <Button size="sm" asChild className={lista ? 'w-full justify-center' : undefined}>
          <Link href="/cadastrar-empresa">Cadastro de Empresa</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={classeContentor}>
      {isAdmin && (
        <Link
          href="/admin"
          className={`${classeLink} text-orange-500 dark:text-orange-400`}
        >
          Admin
        </Link>
      )}
      <Link href="/editar-perfil" className={classeLink}>
        Editar perfil
      </Link>
      <Link href="/cadastrar-servico" className={classeLink}>
        Cadastro de Profissional
      </Link>
      <form action={logoutAction} className={lista ? 'w-full' : undefined}>
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className={`text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400${lista ? ' w-full justify-start px-3 text-base' : ''}`}
        >
          Sair
        </Button>
      </form>
    </div>
  )
}
