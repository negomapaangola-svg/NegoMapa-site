'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { PROVINCIAS_ANGOLA } from '@/lib/listas-selecao'
import { PedidoServico, ServicoParaPedido, cancelarPedido, criarPedido } from '@/lib/actions/pedidos-servico'
import { formatDate } from '@/lib/utils'

type Props = {
  pedidos: PedidoServico[]
  /** Serviço e profissional validados a partir da página de serviço, quando existem. */
  prefill?: ServicoParaPedido | null
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

const campo =
  'w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream'

export function PedidosCliente({ pedidos, prefill = null }: Props) {
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const [lista, setLista] = React.useState<PedidoServico[]>(pedidos)

  React.useEffect(() => {
    setLista(pedidos)
  }, [pedidos])

  function submeter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      const resultado = await criarPedido(formData)
      if (resultado.success) {
        setFeedback({ tipo: 'sucesso', texto: 'Pedido enviado. Será contactado pelos profissionais disponíveis.' })
        formRef.current?.reset()
      } else {
        setFeedback({ tipo: 'erro', texto: resultado.error ?? 'Ocorreu um erro.' })
      }
    })
  }

  function cancelar(pedido: PedidoServico) {
    if (!window.confirm(`Cancelar o pedido "${pedido.titulo}"? Esta ação não pode ser desfeita.`)) return
    setFeedback(null)
    startTransition(async () => {
      const resultado = await cancelarPedido(pedido.id)
      if (resultado.success) {
        setLista((atuais) => atuais.map((p) => (p.id === pedido.id ? { ...p, estado: 'cancelado' } : p)))
        setFeedback({ tipo: 'sucesso', texto: 'Pedido cancelado.' })
      } else {
        setFeedback({ tipo: 'erro', texto: 'Não foi possível cancelar o pedido.' })
      }
    })
  }

  return (
    <div className="space-y-10">
      <form ref={formRef} onSubmit={submeter} className="space-y-5" aria-labelledby="novo-pedido-titulo">
        <h2 id="novo-pedido-titulo" className="text-xl font-bold text-ink dark:text-cream">Novo pedido</h2>

        {prefill ? (
          <div className="px-4 py-3 rounded-[4px] border border-orange-200 bg-orange-50 text-sm text-ink dark:border-orange-800 dark:bg-orange-900/20 dark:text-cream">
            Pedido de orçamento para <span className="font-medium">{prefill.titulo_servico}</span>, dirigido a{' '}
            <span className="font-medium">{prefill.nome_profissional}</span>.
            <input type="hidden" name="servico_id" value={prefill.servico_id} />
            <input type="hidden" name="profissional_id" value={prefill.profissional_id} />
          </div>
        ) : null}

        <div>
          <label htmlFor="pedido-titulo" className="block text-sm font-medium text-ink dark:text-cream mb-1">Título <span aria-hidden="true">*</span></label>
          <input id="pedido-titulo" name="titulo" type="text" required minLength={3} maxLength={200} className={campo} />
        </div>

        <div>
          <label htmlFor="pedido-descricao" className="block text-sm font-medium text-ink dark:text-cream mb-1">Descrição <span aria-hidden="true">*</span></label>
          <textarea id="pedido-descricao" name="descricao" required minLength={10} maxLength={2000} rows={5} className={campo} />
        </div>

        <div>
          <label htmlFor="pedido-provincia" className="block text-sm font-medium text-ink dark:text-cream mb-1">Província <span aria-hidden="true">*</span></label>
          <select id="pedido-provincia" name="provincia" required defaultValue="" className={campo}>
            <option value="" disabled>Selecione</option>
            {PROVINCIAS_ANGOLA.map((provincia) => (
              <option key={provincia} value={provincia}>{provincia}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="pedido-data" className="block text-sm font-medium text-ink dark:text-cream mb-1">Data preferida <span className="text-neutral-500 dark:text-cream-text/70">(opcional)</span></label>
            <input id="pedido-data" name="data_preferida" type="date" className={campo} />
          </div>
          <div>
            <label htmlFor="pedido-orcamento" className="block text-sm font-medium text-ink dark:text-cream mb-1">Orçamento em Kz <span className="text-neutral-500 dark:text-cream-text/70">(opcional)</span></label>
            <input id="pedido-orcamento" name="orcamento" type="text" inputMode="decimal" className={campo} />
          </div>
        </div>

        <div>
          <label htmlFor="pedido-contacto" className="block text-sm font-medium text-ink dark:text-cream mb-1">Contacto <span aria-hidden="true">*</span></label>
          <input id="pedido-contacto" name="contacto" type="text" required minLength={3} maxLength={120} className={campo} />
        </div>

        {feedback && (
          <div role="status" aria-live="polite" className={feedback.tipo === 'sucesso'
            ? 'px-4 py-3 rounded-[4px] border border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            : 'px-4 py-3 rounded-[4px] border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}>
            {feedback.texto}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? 'A enviar…' : 'Enviar pedido'}
        </Button>
      </form>

      <section className="space-y-4" aria-labelledby="meus-pedidos-titulo">
        <h2 id="meus-pedidos-titulo" className="text-xl font-bold text-ink dark:text-cream">Pedidos enviados</h2>

        {lista.length === 0 ? (
          <p className="text-neutral-500 dark:text-cream-text/70">Ainda não enviou pedidos.</p>
        ) : (
          lista.map((pedido) => {
            const podeCancelar = pedido.estado === 'novo' || pedido.estado === 'em_analise'
            return (
              <div key={pedido.id} className="p-4 rounded-[4px] border border-card-border bg-white/50 dark:bg-neutral-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="font-medium text-ink dark:text-cream">{pedido.titulo}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto ${ESTADO_ESTILO[pedido.estado] ?? ''}`}>
                    {ESTADO_ROTULO[pedido.estado] ?? pedido.estado}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-cream-text/80 whitespace-pre-wrap">{pedido.descricao}</p>
                <p className="text-xs text-neutral-500 dark:text-cream-text/70">
                  {pedido.provincia} · Enviado em {formatDate(pedido.criada_em)}
                </p>
                {podeCancelar && (
                  <div className="pt-1">
                    <Button variant="outline" size="sm" disabled={pending} onClick={() => cancelar(pedido)}>
                      Cancelar pedido
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
