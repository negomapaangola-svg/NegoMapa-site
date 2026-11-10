'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { iniciarConversaComEmpresa, verificarPodeContactar } from '@/lib/actions/conversas'

type Props = {
  empresaId: string
  /** Chamado antes de navegar, para que o contentor (ex.: pesquisa global) possa fechar-se. */
  aoIniciar?: () => void
  className?: string
}

/**
 * Botão "Contactar" para uma empresa aprovada. Só aparece se a sessão atual puder contactar a empresa
 * (verificado no servidor: sessão, aprovação e não ser a própria empresa).
 * Ao clicar, abre ou reutiliza a conversa e redireciona para ela.
 */
export function BotaoContactarEmpresa({ empresaId, aoIniciar, className }: Props) {
  const router = useRouter()
  const [podeContactar, setPodeContactar] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  React.useEffect(() => {
    let ativo = true
    verificarPodeContactar({ tipo: 'empresa', id: empresaId })
      .then((resultado) => {
        if (ativo) setPodeContactar(resultado.pode)
      })
      .catch(() => {
        if (ativo) setPodeContactar(false)
      })
    return () => {
      ativo = false
    }
  }, [empresaId])

  if (!podeContactar) return null

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
