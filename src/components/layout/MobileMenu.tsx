'use client';

import { useEffect, useRef } from 'react';
import { AuthUserMenu } from './AuthUserMenu';

interface MobileMenuProps { aberto: boolean; onFechar: () => void; pathname: string }

export function MobileMenu({ aberto, onFechar }: MobileMenuProps) {
  const painelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const anteriorOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    painelRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') { onFechar(); return }
      if (evento.key !== 'Tab' || !painelRef.current) return
      const focaveis = Array.from(painelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      if (!focaveis.length) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus() }
      else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus() }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = anteriorOverflow
      document.removeEventListener('keydown', aoTeclar)
      document.querySelector<HTMLButtonElement>('button[aria-controls="mobile-menu"]')?.focus()
    }
  }, [aberto, onFechar])
  if (!aberto) return null
  return <div className="fixed inset-0 z-300 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu principal">
    <button type="button" aria-label="Fechar menu" onClick={onFechar} className="absolute inset-0 h-full w-full bg-black/55" />
    <div id="mobile-menu" ref={painelRef} className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto border-l border-card-border bg-white/95 px-2 shadow-2xl backdrop-blur-xl dark:bg-navy-dark/95">
      <div className="flex min-h-14 items-center justify-between border-b border-card-border px-3 py-2">
        <span className="text-sm font-semibold text-navy dark:text-cream">Menu</span>
        <button type="button" onClick={onFechar} aria-label="Fechar menu" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-navy hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:bg-white/10">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-4"><AuthUserMenu variante="lista" onNavigate={onFechar} /></div>
    </div>
  </div>
}
