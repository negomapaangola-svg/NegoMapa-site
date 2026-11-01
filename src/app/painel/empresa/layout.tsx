import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { obterSessaoPainel } from '@/lib/painel-sessao'
import { caminhoLogin, caminhoPainel } from '@/lib/painel-acesso'
import { PainelShell } from '../_componentes/PainelShell'

/**
 * Guarda do painel da empresa. Verificado no servidor em cada pedido.
 * Sem sessão → login. Outro tipo → o seu próprio painel. Sem tipo único → início.
 */
export default async function PainelEmpresaLayout({ children }: { children: ReactNode }) {
  const sessao = await obterSessaoPainel()
  if (!sessao) redirect(caminhoLogin('/painel/empresa'))
  if (sessao.tipo !== 'empresa') {
    redirect(sessao.tipo ? caminhoPainel(sessao.tipo) : '/')
  }
  return <PainelShell tipo="empresa">{children}</PainelShell>
}
