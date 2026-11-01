'use client'

import { useEffect, useState } from 'react'
import { ATRIBUTO_TEMA, CHAVE_TEMA, type Tema } from '@/lib/painel-tema'

/** Alterna entre modo claro e escuro. Guarda a escolha neste dispositivo. */
export function BotaoTema() {
  const [tema, setTema] = useState<Tema | null>(null)

  useEffect(() => {
    setTema(document.documentElement.getAttribute(ATRIBUTO_TEMA) === 'escuro' ? 'escuro' : 'claro')
  }, [])

  function alternar() {
    const novo: Tema = tema === 'escuro' ? 'claro' : 'escuro'
    try {
      localStorage.setItem(CHAVE_TEMA, novo)
    } catch {
      // Sem armazenamento (ex.: modo privado): o tema aplica-se só nesta visita.
    }
    document.documentElement.setAttribute(ATRIBUTO_TEMA, novo)
    setTema(novo)
  }

  const escuro = tema === 'escuro'

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={tema === null}
      aria-label={escuro ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      title={escuro ? 'Modo claro' : 'Modo escuro'}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--painel-borda)] text-[color:var(--painel-texto-secundario)] hover:bg-[var(--painel-superficie)] hover:text-[color:var(--painel-texto)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--painel-foco)] disabled:opacity-50"
    >
      {escuro ? (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
