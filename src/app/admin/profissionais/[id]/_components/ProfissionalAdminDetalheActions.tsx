'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { avaliarProfissional } from '@/lib/actions/profissionais-admin'

type Props = {
  profissionalId: string
  nome: string
  estado: string
}

export function ProfissionalAdminDetalheActions({ profissionalId, nome, estado }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [motivo, setMotivo] = React.useState('')
  const [confirmacao, setConfirmacao] = React.useState<'aprovado' | 'rejeitado' | null>(null)
  const [feedback, setFeedback] = React.useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  function confirmar() {
    if (!confirmacao) return
    const motivoLimpo = motivo.trim()
    if (confirmacao === 'rejeitado' && motivoLimpo.length < 10) {
      setFeedback({ tipo: 'erro', texto: 'Indique o motivo da rejeição (mínimo 10 caracteres).' })
      return
    }

    const estadoPretendido = confirmacao
    startTransition(async () => {
      try {
        const resultado = await avaliarProfissional(
          profissionalId,
          estadoPretendido,
          estadoPretendido === 'rejeitado' ? motivoLimpo : undefined
        )

        if (!resultado.success) {
          setFeedback({ tipo: 'erro', texto: resultado.error ?? 'Não foi possível alterar o estado.' })
          return
        }

        setFeedback({
          tipo: 'sucesso',
          texto: estadoPretendido === 'aprovado' ? `${nome} foi aprovado.` : `${nome} foi rejeitado.`,
        })
        setConfirmacao(null)
        setMotivo('')
        router.refresh()
      } catch {
        setFeedback({ tipo: 'erro', texto: 'Não foi possível comunicar com o servidor. Tente novamente.' })
      }
    })
  }

  return (
    <section className="min-w-0 space-y-4">
      {feedback && (
        <p
          role={feedback.tipo === 'erro' ? 'alert' : 'status'}
          aria-live={feedback.tipo === 'erro' ? 'assertive' : 'polite'}
          className={feedback.tipo === 'erro'
            ? 'break-words rounded-[4px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
            : 'break-words rounded-[4px] border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'}
        >
          {feedback.texto}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {estado !== 'aprovado' && (
          <Button variant="primary" size="sm" disabled={pending} onClick={() => { setFeedback(null); setConfirmacao('aprovado') }}>
            Aprovar
          </Button>
        )}
        {estado !== 'rejeitado' && (
          <Button variant="destructive" size="sm" disabled={pending} onClick={() => { setFeedback(null); setConfirmacao('rejeitado') }}>
            Rejeitar
          </Button>
        )}
      </div>

      {confirmacao && (
        <div className="space-y-3 rounded-[4px] border border-card-border bg-white/70 p-4 dark:bg-neutral-800/70">
          <h2 className="font-semibold text-ink dark:text-cream">
            {confirmacao === 'aprovado' ? `Confirmar aprovação de ${nome}?` : `Confirmar rejeição de ${nome}?`}
          </h2>
          {confirmacao === 'rejeitado' && (
            <div className="space-y-1">
              <label htmlFor="motivo-rejeicao-detalhe" className="block text-sm font-medium text-ink dark:text-cream">
                Motivo da rejeição
              </label>
              <textarea
                id="motivo-rejeicao-detalhe"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                rows={3}
                className="w-full min-w-0 rounded-[4px] border border-card-border bg-white px-3 py-2 text-sm text-ink placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-neutral-900 dark:text-cream"
                placeholder="Descreva o motivo (mínimo 10 caracteres)"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant={confirmacao === 'aprovado' ? 'primary' : 'destructive'} size="sm" disabled={pending} onClick={confirmar}>
              {pending ? 'A guardar…' : 'Confirmar'}
            </Button>
            <Button variant="outline" size="sm" disabled={pending} onClick={() => { setConfirmacao(null); setMotivo('') }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
