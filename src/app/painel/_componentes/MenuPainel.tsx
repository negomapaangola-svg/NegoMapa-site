'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; rotulo: string }

/**
 * Menus do painel (lateral em desktop, inferior em mobile).
 * Destaca a página atual com aria-current e um fundo de estado ativo.
 */
export function MenuPainel({ base, itens }: { base: string; itens: Item[] }) {
  const pathname = usePathname()

  function estaAtivo(item: Item): boolean {
    const destino = `${base}${item.href}`
    if (item.href === '') return pathname === base
    return pathname === destino || pathname.startsWith(`${destino}/`)
  }

  const classeFoco = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--painel-foco)]'

  return (
    <>
      <nav
        aria-label="Menu do painel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--painel-borda)] bg-[var(--painel-fundo)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex h-16 snap-x items-stretch overflow-x-auto text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {itens.map((item) => {
            const ativo = estaAtivo(item)
            return (
              <li key={item.rotulo} className="flex shrink-0 snap-start">
                <Link
                  href={`${base}${item.href}`}
                  aria-current={ativo ? 'page' : undefined}
                  className={`flex items-center whitespace-nowrap px-4 hover:text-[color:var(--painel-texto)] ${classeFoco} ${
                    ativo ? 'font-semibold text-[color:var(--painel-texto)] bg-[var(--painel-ativo)]' : 'text-[color:var(--painel-texto-secundario)]'
                  }`}
                >
                  {item.rotulo}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <nav aria-label="Menu lateral do painel" className="mx-auto hidden max-w-5xl px-4 pb-10 md:block">
        <ul className="flex flex-wrap gap-2 border-b border-[color:var(--painel-borda)] pb-3">
          {itens.map((item) => {
            const ativo = estaAtivo(item)
            return (
              <li key={item.rotulo}>
                <Link
                  href={`${base}${item.href}`}
                  aria-current={ativo ? 'page' : undefined}
                  className={`inline-block rounded-md px-3 py-1.5 text-sm hover:bg-[var(--painel-superficie)] hover:text-[color:var(--painel-texto)] ${classeFoco} ${
                    ativo ? 'font-semibold text-[color:var(--painel-texto)] bg-[var(--painel-ativo)]' : 'text-[color:var(--painel-texto-secundario)]'
                  }`}
                >
                  {item.rotulo}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
