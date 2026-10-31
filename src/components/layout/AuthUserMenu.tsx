'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/Button'
import { logoutAction } from '@/lib/actions/logout'
import { checkIsAdmin } from '@/lib/actions/admin'

type AuthUserMenuProps = {
  // 'inline': barra do cabeçalho (desktop). 'stacked': painel do menu (telemóvel).
  variant?: 'inline' | 'stacked'
}

const linkBase =
  'text-sm font-medium text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 px-3 py-2 rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2'

export function AuthUserMenu({ variant = 'inline' }: AuthUserMenuProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  const stacked = variant === 'stacked'
  const wrapper = stacked ? 'flex flex-col gap-2' : 'flex items-center gap-3'
  const linkClass = stacked ? `${linkBase} block w-full` : linkBase

  if (!isAuthenticated) {
    return (
      <div className={wrapper}>
        <Link href="/login" className={linkClass}>
          Entrar
        </Link>
        <Button size="sm" asChild className={stacked ? 'w-full' : undefined}>
          <Link href="/cadastrar-empresa">Cadastrar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={wrapper}>
      {isAdmin && (
        <Link
          href="/admin"
          className={`${linkClass} text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300`}
        >
          Painel Admin
        </Link>
      )}
      <Link href="/editar-perfil" className={linkClass}>
        Editar perfil
      </Link>
      <Link href="/cadastrar-servico" className={linkClass}>
        Tornar-me profissional
      </Link>
      <form action={logoutAction} className={stacked ? 'w-full' : undefined}>
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className={`text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 ${stacked ? 'w-full' : ''}`}
        >
          Sair
        </Button>
      </form>
    </div>
  )
}
