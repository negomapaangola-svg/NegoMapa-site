import { redirect } from 'next/navigation'
import { obterSessaoPainel } from '@/lib/painel-sessao'
import { caminhoLogin, caminhoPainel } from '@/lib/painel-acesso'

/** /painel só encaminha para o painel do tipo do utilizador. */
export default async function PainelRaizPage() {
  const sessao = await obterSessaoPainel()
  if (!sessao) redirect(caminhoLogin('/painel'))
  if (!sessao.tipo) redirect('/')
  redirect(caminhoPainel(sessao.tipo))
}
