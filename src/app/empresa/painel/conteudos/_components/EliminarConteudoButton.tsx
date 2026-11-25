'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { eliminarServico, eliminarProduto } from '@/lib/actions/eliminacao'

type Props = {
  tipo: 'servico' | 'produto'
  id: string
  empresaId: string
}

export function EliminarConteudoButton({ tipo, id, empresaId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function eliminar() {
    if (!window.confirm('Tem certeza? Esta ação não pode ser revertida.')) return

    setError(null)
    startTransition(async () => {
      const result = tipo === 'servico'
        ? await eliminarServico(id, empresaId)
        : await eliminarProduto(id, empresaId)

      if (!result.success) {
        setError(result.error ?? 'Não foi possível eliminar o registo.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="destructive" size="sm" disabled={pending} onClick={eliminar}>
        {pending ? 'A eliminar…' : 'Eliminar'}
      </Button>
      {error && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{error}</p>}
    </div>
  )
}
