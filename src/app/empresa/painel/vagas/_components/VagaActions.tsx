'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { encerrarVaga } from '@/lib/actions/vagas'

type Props = {
  vagaId: string
  vagaSlug: string
  empresaId: string
  estado: string
  encerradaEm: string | null
}

export function VagaActions({ vagaId, vagaSlug, empresaId, estado, encerradaEm }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function fechar() {
    if (!window.confirm('Tem a certeza de que pretende encerrar esta vaga? Deixará de aparecer na pesquisa e de aceitar candidaturas.')) return
    setError(null)
    startTransition(async () => {
      const result = await encerrarVaga(vagaId, empresaId)
      if (!result.success) {
        setError(result.error ?? 'Não foi possível encerrar a vaga.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {estado === 'aprovado' && !encerradaEm && (
        <Link href={`/vaga/${vagaSlug}`}>
          <Button variant="outline" size="sm">Ver detalhe</Button>
        </Link>
      )}
      {!encerradaEm ? (
        <div className="flex flex-wrap gap-2">
          <Link href={`/empresa/painel/vagas/${vagaId}/editar?empresa=${encodeURIComponent(empresaId)}`}>
            <Button variant="outline" size="sm">Editar</Button>
          </Link>
          {estado === 'aprovado' && (
            <Button variant="destructive" size="sm" disabled={pending} onClick={fechar}>
              {pending ? 'A encerrar…' : 'Encerrar vaga'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-600 dark:text-cream-text/70">Esta vaga foi encerrada.</span>
        </div>
      )}
      {error && <p role="alert" className="max-w-xs text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  )
}
