'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  avaliarPedidoMudancaTipoConta,
  type PedidoMudancaTipoConta,
} from '@/lib/actions/conta-tipo'

export function PedidosTipoContaList({ pedidos }: { pedidos: PedidoMudancaTipoConta[] }) {
  const [motivos, setMotivos] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [pendente, startTransition] = useTransition()
  const router = useRouter()

  function avaliar(id: string, decisao: 'approve' | 'reject') {
    setErro('')
    setMensagem('')
    const motivo = motivos[id] ?? ''
    if (decisao === 'reject' && motivo.trim().length < 10) {
      setErro('Para rejeitar, indique um motivo com pelo menos 10 caracteres.')
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
            Nota administrativa (obrigatória para rejeitar)
            <textarea
              value={motivos[pedido.id] ?? ''}
              onChange={(event) => setMotivos((actual) => ({ ...actual, [pedido.id]: event.target.value }))}
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
    </div>
  )
}
