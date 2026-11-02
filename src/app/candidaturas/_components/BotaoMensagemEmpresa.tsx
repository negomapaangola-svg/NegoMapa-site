'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { iniciarConversaComEmpresa } from '@/lib/actions/conversas'

type Props = {
  empresaId: string
}

/** Abre (ou reutiliza) a conversa do candidato com a empresa da vaga. */
export function BotaoMensagemEmpresa({ empresaId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [erro, setErro] = React.useState<string | null>(null)

  function enviar() {
    setErro(null)
    startTransition(async () => {
      const resultado = await iniciarConversaComEmpresa(empresaId)
      if (resultado.success) {
        router.push(`/mensagens?conversa=${encodeURIComponent(resultado.conversaId)}`)
      } else {
        setErro(resultado.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={enviar} disabled={pending}>
        {pending ? 'A abrir conversa…' : 'Enviar mensagem à empresa'}
      </Button>
      {erro && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{erro}</p>}
    </div>
  )
}
