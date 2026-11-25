'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { eliminarConteudoAdmin } from '@/lib/actions/admin-eliminacao'

export function AdminProdutoDeleteButton({
  produtoId,
  onEliminado,
}: {
  produtoId: string
  onEliminado: (produtoId: string) => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function eliminar() {
    if (!window.confirm('Tem certeza? Esta ação não pode ser revertida.')) return
    setPending(true)
    setError(null)
    const result = await eliminarConteudoAdmin('produto', produtoId)
    setPending(false)

    if (result.success) {
      onEliminado(produtoId)
    } else {
      setError(result.error || 'Não foi possível eliminar o produto.')
    }
  }

  return (
    <div className="mt-3 flex flex-col items-start gap-1">
      <Button variant="destructive" size="sm" disabled={pending} onClick={eliminar}>
        {pending ? 'A eliminar…' : 'Eliminar'}
      </Button>
      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
