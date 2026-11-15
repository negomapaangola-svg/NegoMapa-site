'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { aprovarEmpresa, rejeitarEmpresa, suspenderEmpresa } from '@/lib/actions/empresas'
type Props = { empresaId: string; isApproved: boolean }
export function EmpresaAdminActions({ empresaId, isApproved }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{ success: boolean; text: string } | null>(null)
  function run(action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action(empresaId)
      setFeedback({ success: result.success, text: result.success ? 'Alteração guardada.' : result.error || 'Não foi possível concluir a acção.' })
      if (result.success) router.refresh()
    })
  }
  function reject() {
    const motivo = window.prompt('Indique o motivo da rejeição (mínimo 10 caracteres):')
    if (motivo === null) return
    if (motivo.trim().length < 10) { setFeedback({ success: false, text: 'O motivo deve ter pelo menos 10 caracteres.' }); return }
    startTransition(async () => {
      const result = await rejeitarEmpresa(empresaId, motivo)
      setFeedback({ success: result.success, text: result.success ? 'Empresa rejeitada.' : result.error || 'Não foi possível rejeitar a empresa.' })
      if (result.success) router.refresh()
    })
  }
  return <div className="flex w-full flex-col gap-2 sm:w-auto">
    {isApproved ? <div className="flex flex-col gap-2 sm:flex-row">
      <span className="self-center text-sm font-semibold text-green-700 dark:text-green-400">Aprovada</span>
      <Button variant="destructive" size="sm" disabled={pending} onClick={() => run(suspenderEmpresa)} className="min-h-10 w-full sm:w-auto">Suspender</Button>
    </div> : <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="primary" size="sm" disabled={pending} onClick={() => run(aprovarEmpresa)} className="min-h-10 w-full sm:w-auto">Aprovar</Button>
      <Button variant="destructive" size="sm" disabled={pending} onClick={reject} className="min-h-10 w-full sm:w-auto">Rejeitar</Button>
    </div>}
    {feedback ? <p role={feedback.success ? 'status' : 'alert'} className={feedback.success ? 'text-xs font-medium text-green-700 dark:text-green-400' : 'text-xs font-medium text-red-700 dark:text-red-400'}>{feedback.text}</p> : null}
  </div>
}