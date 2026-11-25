'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { eliminarEmpresa } from '@/lib/actions/eliminacao'

export function EliminarEmpresaButton({ empresaId }: { empresaId: string }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function eliminar() {
    const mensagem = 'Ao eliminar a empresa, os serviços, produtos e vagas associados deixarão de estar disponíveis. Esta ação não pode ser revertida.'
    if (!window.confirm(mensagem)) return

    setError(null)
    startTransition(async () => {
      const result = await eliminarEmpresa(empresaId)
      if (!result.success) {
        setError(result.error ?? 'Não foi possível eliminar a empresa.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <Button variant="destructive" size="sm" disabled={pending} onClick={eliminar}>
        {pending ? 'A eliminar…' : 'Eliminar empresa'}
      </Button>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  )
}
