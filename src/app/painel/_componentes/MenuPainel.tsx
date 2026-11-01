'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { IconePainel } from './IconesPainel'
import { NUMERO_OPCOES_DIRETAS, type ItemPainel } from './itens'

const FOCO =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--painel-foco)]'

/**
 * Menus do painel.
 * - Desktop (md+): barra superior com todas as opções sempre visíveis.
 * - Telemóvel: barra inferior fixa com as primeiras opções e um botão "Menu"
 *   que abre a lista completa.
 * A página atual fica destacada (aria-current="page").
 */
export function MenuPainel({ base, itens }: { base: string; itens: ItemPainel[] }) {
  const pathname = usePathname()
  const [menuAberto, setMenuAberto] = useState(false)
  const botaoFechar = useRef<HTMLButtonElement>(null)

  function estaAtivo(item: ItemPainel): boolean {
    const destino = `${base}${item.href}`
    if (item.href === '') return pathname === base
    return pathname === destino || pathname.startsWith(`${destino}/`)
  }

  const diretas = itens.slice(0, NUMERO_OPCOES_DIRETAS)
  const ocultas = itens.slice(NUMERO_OPCOES_DIRETAS)
  const ocultaAtiva = ocultas.some(estaAtivo)

  // Fecha com Escape e move o foco para o botão de fechar ao abrir.
  useEffect(() => {
    if (!menuAberto) return
    botaoFechar.current?.focus()
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setMenuAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  return (
    <>
      {/* Telemóvel: barra inferior fixa */}
      <nav
        aria-label="Menu do painel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--painel-borda)] bg-[var(--painel-fundo)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-4">
          {diretas.map((item) => {
            const ativo = estaAtivo(item)
            return (
              <li key={item.rotulo}>
                <Link
                  href={`${base}${item.href}`}
                  aria-current={ativo ? 'page' : undefined}
                  onClick={() => setMenuAberto(false)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xs leading-tight [overflow-wrap:anywhere] hover:text-[color:var(--painel-texto)] ${FOCO} ${
                    ativo
                      ? 'font-semibold text-[color:var(--painel-texto)] bg-[var(--painel-ativo)]'
                      : 'text-[color:var(--painel-texto-secundario)]'
                  }`}
                >
                  <IconePainel nome={item.icone} />
                  <span>{item.rotulo}</span>
                </Link>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              aria-expanded={menuAberto}
              aria-controls="menu-completo-painel"
              onClick={() => setMenuAberto((aberto) => !aberto)}
              className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xs leading-tight hover:text-[color:var(--painel-texto)] ${FOCO} ${
                ocultaAtiva
                  ? 'font-semibold text-[color:var(--painel-texto)] bg-[var(--painel-ativo)]'
                  : 'text-[color:var(--painel-texto-secundario)]'
              }`}
            >
              <IconePainel nome="menu" />
              <span>Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Telemóvel: lista completa aberta pelo botão Menu */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAberto(false)} aria-hidden="true" />
          <div
            id="menu-completo-painel"
            role="dialog"
            aria-modal="true"
            aria-label="Todas as opções do painel"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-[color:var(--painel-borda)] bg-[var(--painel-fundo)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[color:var(--painel-texto)]">Todas as opções</h2>
              <button
                ref={botaoFechar}
                type="button"
                onClick={() => setMenuAberto(false)}
                className={`min-h-11 rounded-md px-4 text-sm text-[color:var(--painel-texto-secundario)] hover:text-[color:var(--painel-texto)] ${FOCO}`}
              >
                Fechar
              </button>
            </div>
            <ul className="flex flex-col gap-1">
              {itens.map((item) => {
                const ativo = estaAtivo(item)
                return (
                  <li key={item.rotulo}>
                    <Link
                      href={`${base}${item.href}`}
                      aria-current={ativo ? 'page' : undefined}
                      onClick={() => setMenuAberto(false)}
                      className={`flex min-h-14 items-center gap-3 rounded-lg px-4 text-base hover:bg-[var(--painel-superficie)] hover:text-[color:var(--painel-texto)] ${FOCO} ${
                        ativo
                          ? 'font-semibold text-[color:var(--painel-texto)] bg-[var(--painel-ativo)]'
                          : 'text-[color:var(--painel-texto-secundario)]'
                      }`}
                    >
                      <IconePainel nome={item.icone} className="h-5 w-5 shrink-0" />
                      <span>{item.rotulo}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Desktop: barra superior com todas as opções */}
      <nav aria-label="Menu principal do painel" className="mx-auto hidden max-w-5xl px-4 pb-6 pt-2 md:block">
        <ul className="flex flex-wrap gap-2 border-b border-[color:var(--painel-borda)] pb-3">
          {itens.map((item) => {
            const ativo = estaAtivo(item)
            return (
              <li key={item.rotulo}>
                <Link
                  href={`${base}${item.href}`}
                  aria-current={ativo ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--painel-superficie)] hover:text-[color:var(--painel-texto)] ${FOCO} ${
                    ativo
                      ? 'font-semibold text-[color:var(--painel-texto)] bg-[var(--painel-ativo)]'
                      : 'text-[color:var(--painel-texto-secundario)]'
                  }`}
                >
                  <IconePainel nome={item.icone} className="h-4 w-4 shrink-0" />
                  <span>{item.rotulo}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
