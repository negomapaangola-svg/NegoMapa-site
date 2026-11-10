'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { iniciarConversaComEmpresa, verificarPodeContactar } from '@/lib/actions/conversas'

/** Mostra "Contactar empresa" só quando a sessão actual pode contactar esta empresa. */
export function ContactarEmpresaButton({ empresaId }: { empresaId: string }) {
  const router = useRouter()
  const [podeContactar, setPodeContactar] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  React.useEffect(() => {
    let ativo = true
    verificarPodeContactar({ tipo: 'empresa', id: empresaId }).then((resultado) => {
      if (ativo) setPodeContactar(resultado.pode)
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
        router.push(`/mensagens?conversa=${encodeURIComponent(resultado.conversaId)}`)
      } else {
        setErro(resultado.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button type="button" size="lg" onClick={contactar} disabled={pending}>
        {pending ? 'A abrir conversa…' : 'Contactar empresa'}
      </Button>
      {erro && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {erro}
        </p>
      )}
    </div>
  )
}
