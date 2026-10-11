'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/Button'
import { logoutAction } from '@/lib/actions/logout'

export function AuthUserMenu() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setIsLoading(false)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 px-3 py-2 rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          Entrar
        </Link>
        <Button size="sm" asChild>
          <Link href="/login?redirectTo=/cadastrar-empresa">Cadastrar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/editar-perfil"
        className="text-sm font-medium text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 px-3 py-2 rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        Editar perfil
      </Link>
      <form action={logoutAction}>
        <Button type="submit" size="sm" variant="ghost" className="text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400">
          Sair
        </Button>
      </form>
    </div>
  )
}