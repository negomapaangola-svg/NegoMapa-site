import type { ReactNode } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/lib/actions/logout'
import type { TipoPainel } from '@/lib/painel-acesso'

type Item = { href: string; rotulo: string }

const ITENS_COMUNS: Item[] = [
  { href: '', rotulo: 'Visão geral' },
  { href: '/perfil', rotulo: 'Perfil' },
  { href: '/vagas', rotulo: 'Vagas' },
  { href: '/avaliacoes', rotulo: 'Avaliações' },
  { href: '/configuracoes', rotulo: 'Configurações' },
]

const ITENS_POR_TIPO: Record<TipoPainel, Item[]> = {
  empresa: [
    ...ITENS_COMUNS,
    { href: '/produtos-servicos', rotulo: 'Produtos e serviços' },
    { href: '/investimento', rotulo: 'Investimento' },
  ],
  profissional: [
    ITENS_COMUNS[0],
    ITENS_COMUNS[1],
    { href: '/servicos', rotulo: 'Serviços' },
    { href: '/portfolio', rotulo: 'Portfólio' },
    { href: '/disponibilidade', rotulo: 'Disponibilidade' },
    ...ITENS_COMUNS.slice(2),
  ],
}

const TITULO_POR_TIPO: Record<TipoPainel, string> = {
  empresa: 'Painel da empresa',
  profissional: 'Painel profissional',
}

/**
 * Cabeçalho e menu inferior dos painéis (mobile-first).
 * Recebe o tipo já validado pelo layout do servidor; não decide acesso.
 */
export function PainelShell({
  tipo,
  children,
}: {
  tipo: TipoPainel
  children: ReactNode
}) {
  const base = `/painel/${tipo}`
  const itens = ITENS_POR_TIPO[tipo]

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href={base} className="text-base font-semibold text-neutral-900">
            NegóMapa
          </Link>
          <span className="text-sm text-neutral-500">{TITULO_POR_TIPO[tipo]}</span>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-neutral-600 underline-offset-4 hover:underline">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-10">{children}</main>

      <nav
        aria-label="Menu do painel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex h-16 snap-x items-stretch overflow-x-auto text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {itens.map((item) => (
            <li key={item.rotulo} className="flex shrink-0 snap-start">
              <Link
                href={`${base}${item.href}`}
                className="flex items-center whitespace-nowrap px-4 text-neutral-600 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
              >
                {item.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Menu lateral do painel" className="mx-auto hidden max-w-5xl px-4 pb-10 md:block">
        <ul className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
          {itens.map((item) => (
            <li key={item.rotulo}>
              <Link
                href={`${base}${item.href}`}
                className="inline-block rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                {item.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
