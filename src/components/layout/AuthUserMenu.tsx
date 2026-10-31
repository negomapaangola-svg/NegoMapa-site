'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/Button'
import { logoutAction } from '@/lib/actions/logout'
import { checkIsAdmin } from '@/lib/actions/admin'

// 'desktop': cabeçalho em ecrãs grandes. Sem sessão mostra Entrar/Cadastrar; com sessão mostra o ícone de conta.
// 'icon': cabeçalho em telemóvel. Só mostra o ícone de conta (com sessão).
// 'stacked': painel do menu móvel. Sem sessão mostra Entrar/Cadastrar; com sessão não mostra nada (a conta está no ícone).
type Variante = 'desktop' | 'icon' | 'stacked'

type ItemConta = { label: string; href: string } | { label: string; emBreve: true }

const ITENS_CONTA: ItemConta[] = [
  { label: 'Editar perfil', href: '/editar-perfil' },
  { label: 'Os meus serviços', emBreve: true },
  { label: 'As minhas vagas', emBreve: true },
  { label: 'As minhas candidaturas', emBreve: true },
  { label: 'Notificações', emBreve: true },
]

const linkBase =
  'text-sm font-medium text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 px-3 py-2 rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2'

const itemMenu =
  'flex w-full items-center rounded-[4px] px-3 py-2.5 text-sm font-medium text-navy dark:text-cream hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-navy/40 dark:hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500'

export function AuthUserMenu({ variant = 'desktop' }: { variant?: Variante }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const pathname = usePathname()

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
        setAberto(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fecha o menu ao navegar.
  useEffect(() => {
    setAberto(false)
  }, [pathname])

  // Fecha o menu com clique fora ou Escape.
  useEffect(() => {
    if (!aberto) return
    const onClique = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', onClique)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClique)
      document.removeEventListener('keydown', onKey)
    }
  }, [aberto])

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    if (variant === 'icon') return null
    const stacked = variant === 'stacked'
    return (
      <div className={stacked ? 'flex flex-col gap-2' : 'flex items-center gap-3'}>
        <Link href="/login" className={stacked ? `${linkBase} block w-full` : linkBase}>
          Entrar
        </Link>
        <Button size="sm" asChild className={stacked ? 'w-full' : undefined}>
          <Link href="/cadastrar-empresa">Cadastrar</Link>
        </Button>
      </div>
    )
  }

  if (variant === 'stacked') return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Conta do utilizador"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={menuId}
        onClick={() => setAberto((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full liquid-glass-subtle text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {aberto && (
        <div
          id={menuId}
          role="menu"
          aria-label="Menu da conta"
          className="absolute right-0 z-300 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-[8px] p-2 liquid-glass dark:liquid-glass-dark shadow-lg"
        >
          {isAdmin && (
            <Link role="menuitem" href="/admin" className={`${itemMenu} text-orange-500 dark:text-orange-400`}>
              Painel Admin
            </Link>
          )}

          {ITENS_CONTA.map((item) =>
            'href' in item ? (
              <Link key={item.label} role="menuitem" href={item.href} className={itemMenu}>
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                role="menuitem"
                aria-disabled="true"
                tabIndex={-1}
                className="flex w-full cursor-not-allowed select-none items-center justify-between rounded-[4px] px-3 py-2.5 text-sm font-medium text-neutral-500 dark:text-cream-text/60"
              >
                {item.label}
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:bg-navy dark:text-cream-text/70">
                  Em breve
                </span>
              </span>
            )
          )}

          <Link role="menuitem" href="/cadastrar-servico" className={itemMenu}>
            Tornar-me profissional
          </Link>

          <div className="my-2 border-t border-card-border" />

          <form action={logoutAction}>
            <button type="submit" role="menuitem" className={`${itemMenu} justify-start`}>
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
