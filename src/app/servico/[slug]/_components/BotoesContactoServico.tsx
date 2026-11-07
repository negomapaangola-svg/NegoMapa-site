'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { iniciarConversaComProfissional } from '@/lib/actions/conversas'

type Props = {
  servicoId: string
  profissionalId: string
}

export function BotoesContactoServico({ servicoId, profissionalId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [erro, setErro] = React.useState<string | null>(null)

  function pedirOrcamento() {
    router.push(`/pedidos?servico=${encodeURIComponent(servicoId)}&profissional=${encodeURIComponent(profissionalId)}`)
  }

  function enviarMensagem() {
    setErro(null)
    startTransition(async () => {
      const resultado = await iniciarConversaComProfissional(profissionalId)
      if (resultado.success) {
        router.push(`/mensagens?conversa=${encodeURIComponent(resultado.conversaId)}`)
      } else {
        setErro(resultado.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="primary" onClick={pedirOrcamento} disabled={pending}>
          Pedir orçamento
        </Button>
        <Button type="button" variant="outline" onClick={enviarMensagem} disabled={pending}>
          {pending ? 'A abrir conversa…' : 'Enviar mensagem'}
        </Button>
      </div>
      {erro && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">{erro}</p>
      )}
    </div>
  )
}
