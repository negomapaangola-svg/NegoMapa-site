'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  PedidoProfissional,
  atualizarEstadoPedidoProfissional,
} from '@/lib/actions/pedidos-profissional'
import { formatDate } from '@/lib/utils'

type Props = {
  pedidos: PedidoProfissional[]
}

const ESTADO_ROTULO: Record<string, string> = {
  novo: 'Novo',
  em_analise: 'Em análise',
  aceite: 'Aceite',
  recusado: 'Recusado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const ESTADO_ESTILO: Record<string, string> = {
  novo: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  em_analise: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  aceite: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  recusado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  concluido: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  cancelado: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}

const ACAO_ROTULO: Record<string, string> = {
  em_analise: 'Marcar em análise',
  aceite: 'Aceitar',
  recusado: 'Recusar',
  concluido: 'Marcar concluído',
  cancelado: 'Cancelar',
}

export function PedidosProfissional({ pedidos }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  function alterar(pedido: PedidoProfissional, novoEstado: string) {
    const rotulo = ACAO_ROTULO[novoEstado] ?? novoEstado
    if (!window.confirm(`${rotulo} o pedido "${pedido.titulo}"?`)) return
    setFeedback(null)
    startTransition(async () => {
      const resultado = await atualizarEstadoPedidoProfissional(pedido.id, novoEstado)
      if (resultado.success) {
        setFeedback({ tipo: 'sucesso', texto: `Pedido atualizado: ${ESTADO_ROTULO[novoEstado] ?? novoEstado}.` })
        router.refresh()
      } else {
        setFeedback({ tipo: 'erro', texto: resultado.error ?? 'Não foi possível atualizar o pedido.' })
      }
    })
  }

  if (pedidos.length === 0) {
    return <p className="text-neutral-500 dark:text-cream-text/70">Ainda não recebeu pedidos.</p>
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div role="status" aria-live="polite" className={feedback.tipo === 'sucesso'
          ? 'px-4 py-3 rounded-[4px] border border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
          : 'px-4 py-3 rounded-[4px] border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}>
          {feedback.texto}
        </div>
      )}

      {pedidos.map((pedido) => {
        const acoes = pedido.acoes
        return (
          <div key={pedido.id} className="p-4 rounded-[4px] border border-card-border bg-white/50 dark:bg-neutral-800/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="font-medium text-ink dark:text-cream">{pedido.titulo}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto ${ESTADO_ESTILO[pedido.estado] ?? ''}`}>
                {ESTADO_ROTULO[pedido.estado] ?? pedido.estado}
              </span>
            </div>

            <p className="text-sm text-neutral-700 dark:text-cream-text whitespace-pre-wrap">{pedido.descricao}</p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-neutral-600 dark:text-cream-text/80">
              <div><dt className="inline font-medium">Província: </dt><dd className="inline">{pedido.provincia}</dd></div>
              <div><dt className="inline font-medium">Recebido em: </dt><dd className="inline">{formatDate(pedido.criada_em)}</dd></div>
              {pedido.data_preferida && (
                <div><dt className="inline font-medium">Data preferida: </dt><dd className="inline">{formatDate(pedido.data_preferida)}</dd></div>
              )}
              {pedido.orcamento !== null && (
                <div><dt className="inline font-medium">Orçamento: </dt><dd className="inline">{pedido.orcamento} Kz</dd></div>
              )}
              <div><dt className="inline font-medium">Contacto do cliente: </dt><dd className="inline">{pedido.contacto}</dd></div>
            </dl>

            {acoes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {acoes.map((estado) => (
                  <Button
                    key={estado}
                    variant={estado === 'recusado' || estado === 'cancelado' ? 'destructive' : 'outline'}
                    size="sm"
                    disabled={pending}
                    onClick={() => alterar(pedido, estado)}
                  >
                    {ACAO_ROTULO[estado] ?? estado}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
