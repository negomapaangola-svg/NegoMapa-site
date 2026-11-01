import type { ReactNode } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/lib/actions/logout'
import type { TipoPainel } from '@/lib/painel-acesso'
import { SCRIPT_TEMA_INICIAL } from '@/lib/painel-tema'
import { BotaoTema } from './BotaoTema'
import { MenuPainel } from './MenuPainel'
import { ITENS_POR_TIPO } from './itens'

const TITULO_POR_TIPO: Record<TipoPainel, string> = {
  empresa: 'Painel da empresa',
  profissional: 'Painel profissional',
}

/**
 * Cabeçalho e menus dos painéis (mobile-first).
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
    <div className="min-h-screen bg-[var(--painel-fundo)] text-[color:var(--painel-texto)]">
      {/* Aplica o tema guardado (ou o do sistema) antes da primeira pintura. Script constante. */}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />

      <header className="sticky top-0 z-40 border-b border-[color:var(--painel-borda)] bg-[var(--painel-fundo)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href={base} className="text-base font-semibold text-[color:var(--painel-texto)]">
            NegóMapa
          </Link>
          <span className="hidden text-sm text-[color:var(--painel-texto-secundario)] sm:inline">{TITULO_POR_TIPO[tipo]}</span>
          <div className="flex items-center gap-3">
            <BotaoTema />
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-[color:var(--painel-texto-secundario)] underline-offset-4 hover:text-[color:var(--painel-texto)] hover:underline"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-10">{children}</main>

      <MenuPainel base={base} itens={itens} />
    </div>
  )
}
