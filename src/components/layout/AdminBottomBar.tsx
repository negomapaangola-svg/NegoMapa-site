'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { checkIsAdmin } from '@/lib/actions/admin'
import { logoutAction } from '@/lib/actions/logout'

const itemBase =
  'flex flex-1 flex-col items-center justify-center text-sm font-medium text-cream hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500'

export function AdminBottomBar() {
  const pathname = usePathname() ?? ''
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isAdminRoute) {
      setVisible(false)
      return
    }

    let active = true
    const supabase = createBrowserSupabaseClient()

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (active) setVisible(false)
        return
      }
      const admin = await checkIsAdmin()
      if (active) setVisible(admin)
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setVisible(false)
        return
      }
      checkIsAdmin().then((admin) => {
        if (active) setVisible(admin)
      })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [isAdminRoute])

  if (!isAdminRoute || !visible) return null

  return (
    <>
      {/* Espaço no fim da página para o conteúdo não ficar por baixo da barra */}
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom))]" />

      <nav
        aria-label="Navegação de administração"
        className="fixed inset-x-0 bottom-0 z-50 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] border-t border-card-border bg-navy dark:bg-navy-dark md:mx-auto md:max-w-lg md:rounded-t-[8px]"
      >
        <ul className="flex h-16 items-stretch">
          <li className="flex flex-1">
            <Link
              href="/admin"
              aria-current={pathname === '/admin' ? 'page' : undefined}
              className={`${itemBase} ${pathname === '/admin' ? 'text-orange-400' : ''}`}
            >
              Admin
            </Link>
          </li>
          <li className="flex flex-1">
            <Link
              href="/editar-perfil"
              aria-current={pathname === '/editar-perfil' ? 'page' : undefined}
              className={`${itemBase} ${pathname === '/editar-perfil' ? 'text-orange-400' : ''}`}
            >
              Editar perfil
            </Link>
          </li>
          <li className="flex flex-1">
            <form action={logoutAction} className="flex flex-1">
              <button type="submit" className={`${itemBase} w-full`}>
                Sair
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </>
  )
}
