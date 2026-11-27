'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  avaliarPedidoMudancaTipoConta,
  type DecisaoMudancaTipoConta,
  type PedidoMudancaTipoConta,
} from '@/lib/actions/conta-tipo'

export function PedidosTipoContaList({ pedidos, historico }: { pedidos: PedidoMudancaTipoConta[]; historico: DecisaoMudancaTipoConta[] }) {
  const [motivos, setMotivos] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [pendente, startTransition] = useTransition()
  const router = useRouter()

  function avaliar(id: string, decisao: 'approve' | 'reject') {
    setErro('')
    setMensagem('')
    const motivo = motivos[id] ?? ''
    if (motivo.trim().length < 10 || motivo.trim().length > 1000) {
      setErro('Indique um motivo entre 10 e 1000 caracteres para aprovar ou rejeitar.')
      return
    }
    startTransition(async () => {
      const resultado = await avaliarPedidoMudancaTipoConta(id, decisao, motivo)
      if (!resultado.ok) {
        setErro(resultado.message)
        return
      }
      setMensagem(resultado.message)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {mensagem && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">{mensagem}</p>}
      {erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{erro}</p>}
      {pedidos.length === 0
        ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Não existem pedidos pendentes.</p>
        : pedidos.map((pedido) => (
        <article key={pedido.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{pedido.display_name}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Pedido para {pedido.requested_account_type === 'profissional' ? 'Profissional' : 'Empresa'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Utilizador: {pedido.user_id}</p>
            </div>
            <time className="text-xs text-slate-500" dateTime={pedido.requested_at}>
              {new Date(pedido.requested_at).toLocaleString('pt-AO')}
            </time>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            Motivo da decisão (obrigatório para aprovar ou rejeitar)
            <textarea
              value={motivos[pedido.id] ?? ''}
              onChange={(event) => setMotivos((actual) => ({ ...actual, [pedido.id]: event.target.value }))}
              required
              minLength={10}
              maxLength={1000}
              rows={2}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={pendente} onClick={() => avaliar(pedido.id, 'approve')} className="inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">
              Aprovar pedido
            </button>
            <button type="button" disabled={pendente} onClick={() => avaliar(pedido.id, 'reject')} className="inline-flex min-h-10 items-center rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300">
              Rejeitar pedido
            </button>
          </div>
        </article>
      ))}

      <section className="space-y-3 pt-6">
        <div>
          <h2 className="text-xl font-semibold">Histórico de decisões</h2>
          <p className="text-sm text-slate-500">Pedidos anteriormente aprovados ou rejeitados, com responsável e justificação.</p>
        </div>
        {historico.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Ainda não existem decisões registadas.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Pedido</th>
                  <th className="px-4 py-3 font-semibold">Decisão</th>
                  <th className="px-4 py-3 font-semibold">Administrador</th>
                  <th className="px-4 py-3 font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {historico.map((decisao) => (
                  <tr key={decisao.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3"><time dateTime={decisao.reviewed_at}>{new Date(decisao.reviewed_at).toLocaleString('pt-AO')}</time></td>
                    <td className="px-4 py-3">{decisao.display_name}<span className="block text-xs text-slate-500">{decisao.requested_account_type === 'profissional' ? 'Profissional' : 'Empresa'}</span></td>
                    <td className="px-4 py-3">{decisao.status === 'approved' ? 'Aprovado' : 'Rejeitado'}</td>
                    <td className="px-4 py-3">{decisao.reviewer_name}</td>
                    <td className="max-w-sm whitespace-pre-wrap px-4 py-3">{decisao.review_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
