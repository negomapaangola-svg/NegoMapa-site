'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { aprovarEmpresa, rejeitarEmpresa, suspenderEmpresa } from '@/lib/actions/empresas'

type Props = {
  empresaId: string
  isApproved: boolean
}

export function EmpresaAdminActions({ empresaId, isApproved }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function run(action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action(empresaId)
      if (!result.success) alert(result.error)
      router.refresh()
    })
  }

  if (!isApproved) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button variant="primary" size="sm" disabled={pending} onClick={() => run(aprovarEmpresa)} className="w-full sm:w-auto">
          Aprovar
        </Button>
        <Button variant="destructive" size="sm" disabled={pending} onClick={() => run(rejeitarEmpresa)} className="w-full sm:w-auto">
          Rejeitar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <span className="text-sm font-medium text-green-600 dark:text-green-400 self-center sm:self-auto">
        Aprovada
      </span>
      <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(suspenderEmpresa)} className="w-full sm:w-auto">
        Suspender
      </Button>
    </div>
  )
}
