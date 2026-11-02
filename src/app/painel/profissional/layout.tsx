import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { obterSessaoPainel } from '@/lib/painel-sessao'
import { caminhoLogin, caminhoPainel } from '@/lib/painel-acesso'
import { PainelShell } from '../_componentes/PainelShell'

/**
 * Guarda do painel profissional. Verificado no servidor em cada pedido.
 * Sem sessão → login. Outro tipo → o seu próprio painel. Sem tipo único → início.
 */
export default async function PainelProfissionalLayout({ children }: { children: ReactNode }) {
  const sessao = await obterSessaoPainel()
  if (!sessao) redirect(caminhoLogin('/painel/profissional'))
  if (sessao.tipo !== 'profissional') {
    redirect(sessao.tipo ? caminhoPainel(sessao.tipo) : '/')
  }
  return <PainelShell tipo="profissional">{children}</PainelShell>
}
