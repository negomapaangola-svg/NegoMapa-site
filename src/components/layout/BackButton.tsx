'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

// Botão "Voltar" para páginas internas. Na página inicial não aparece.
// Sem histórico no separador (primeira página aberta), leva ao início.
export function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  if (!pathname || pathname === '/') return null

  function voltar(e: React.MouseEvent<HTMLAnchorElement>) {
    if (window.history.length > 1) {
      e.preventDefault()
      router.back()
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
      <Link
        href="/"
        onClick={voltar}
        aria-label="Voltar à página anterior"
        className="liquid-glass-subtle inline-flex items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-medium text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </Link>
    </div>
  )
}
