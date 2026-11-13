'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { iniciarConversaComEmpresa } from '@/lib/actions/conversas'

type Props = {
  empresaId: string
  /** Decidido pelo contentor, a partir da verificação em lote. Sem permissão, o botão não é renderizado. */
  visivel?: boolean
  /** Chamado antes de navegar, para que o contentor (ex.: pesquisa global) possa fechar-se. */
  aoIniciar?: () => void
  className?: string
}

/**
 * Botão "Contactar" para uma empresa. Abre ou reutiliza a conversa e redireciona para ela.
 * A permissão é verificada no servidor, em lote, pelo contentor; a ação volta a validá-la.
 */
export function BotaoContactarEmpresa({ empresaId, visivel = true, aoIniciar, className }: Props) {
  const router = useRouter()
  const [erro, setErro] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  if (!visivel) return null

  function contactar() {
    setErro(null)
    startTransition(async () => {
      const resultado = await iniciarConversaComEmpresa(empresaId)
      if (resultado.success) {
        aoIniciar?.()
        router.push(`/mensagens?conversa=${encodeURIComponent(resultado.conversaId)}`)
      } else {
        setErro(resultado.error)
      }
    })
  }

  return (
    <div className={className}>
      <Button type="button" variant="primary" size="sm" onClick={contactar} disabled={pending}>
        {pending ? 'A abrir…' : 'Contactar'}
      </Button>
      {erro && (
        <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">
          {erro}
        </p>
      )}
    </div>
  )
}
