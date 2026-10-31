'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { avaliarProfissional } from '@/lib/actions/admin-profissionais'
import { MOTIVO_MIN_CARACTERES } from '@/lib/profissionais-avaliacao'

export type FeedbackAvaliacao = { tipo: 'sucesso' | 'erro'; texto: string }

type Props = {
  profissionalId: string
  estado: 'pendente' | 'aprovado' | 'rejeitado'
  // A mensagem é guardada no pai, porque este componente desmonta quando o perfil muda de secção.
  onResultado: (feedback: FeedbackAvaliacao) => void
}

export function ProfissionalAdminActions({ profissionalId, estado, onResultado }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [mostrarMotivo, setMostrarMotivo] = React.useState(false)
  const [motivo, setMotivo] = React.useState('')

  const motivoValido = motivo.trim().length >= MOTIVO_MIN_CARACTERES

  function aprovar() {
    startTransition(async () => {
      const result = await avaliarProfissional(profissionalId, 'aprovado')
      if (result.success) {
        onResultado({ tipo: 'sucesso', texto: 'Profissional aprovado com sucesso.' })
        router.refresh()
      } else {
        onResultado({ tipo: 'erro', texto: result.error ?? 'Erro ao aprovar profissional.' })
      }
    })
  }

  function confirmarRejeicao() {
    if (!motivoValido) {
      onResultado({ tipo: 'erro', texto: `O motivo deve ter pelo menos ${MOTIVO_MIN_CARACTERES} caracteres.` })
      return
    }
    startTransition(async () => {
      const result = await avaliarProfissional(profissionalId, 'rejeitado', motivo)
      if (result.success) {
        onResultado({ tipo: 'sucesso', texto: 'Profissional rejeitado. O motivo foi registado.' })
        setMotivo('')
        setMostrarMotivo(false)
        router.refresh()
      } else {
        onResultado({ tipo: 'erro', texto: result.error ?? 'Erro ao rejeitar profissional.' })
      }
    })
  }

  return (
    <div className="w-full space-y-3">
      {!mostrarMotivo && (
        <div className="flex flex-col sm:flex-row gap-2">
          {estado !== 'aprovado' && (
            <Button variant="primary" size="sm" disabled={pending} onClick={aprovar} className="w-full sm:w-auto">
              Aprovar
            </Button>
          )}
          {estado !== 'rejeitado' && (
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => setMostrarMotivo(true)}
              className="w-full sm:w-auto"
            >
              Rejeitar
            </Button>
          )}
        </div>
      )}

      {mostrarMotivo && (
        <div className="space-y-2">
          <label htmlFor={`motivo-${profissionalId}`} className="block text-sm font-medium text-ink dark:text-cream">
            Motivo da rejeição
          </label>
          <textarea
            id={`motivo-${profissionalId}`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            disabled={pending}
            className="w-full rounded-[4px] border border-card-border bg-white dark:bg-navy px-3 py-2 text-sm text-ink dark:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            aria-describedby={`motivo-ajuda-${profissionalId}`}
          />
          <p id={`motivo-ajuda-${profissionalId}`} className="text-xs text-neutral-500 dark:text-cream-text/70">
            {motivo.trim().length}/{MOTIVO_MIN_CARACTERES} caracteres mínimos
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="destructive" size="sm" disabled={pending || !motivoValido} onClick={confirmarRejeicao} className="w-full sm:w-auto">
              Confirmar rejeição
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => {
                setMostrarMotivo(false)
                setMotivo('')
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
