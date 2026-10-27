'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { atualizarEstadoDenuncia } from '@/lib/actions/denuncias'

type Estado = 'analisada' | 'resolvida' | 'arquivada'

type Acao = { estado: Estado; label: string; variant: 'primary' | 'secondary' }

const ACOES_POR_ESTADO: Record<string, Acao[]> = {
  pendente: [
    { estado: 'analisada', label: 'Marcar como analisada', variant: 'secondary' },
    { estado: 'resolvida', label: 'Marcar como resolvida', variant: 'primary' },
  ],
  analisada: [
    { estado: 'resolvida', label: 'Marcar como resolvida', variant: 'primary' },
    { estado: 'arquivada', label: 'Arquivar', variant: 'secondary' },
  ],
  resolvida: [{ estado: 'arquivada', label: 'Arquivar', variant: 'secondary' }],
}

type Props = {
  denunciaId: string
  estado: string
}

export function DenunciaActions({ denunciaId, estado }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  if (estado === 'arquivada') {
    return (
      <span className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        Arquivada
      </span>
    )
  }

  const acoes = ACOES_POR_ESTADO[estado] ?? []

  function run(novoEstado: Estado) {
    startTransition(async () => {
      const result = await atualizarEstadoDenuncia({ denunciaId, estado: novoEstado })
      if (!result.success) alert(result.error)
      router.refresh()
    })
  }

  return (
    <>
      {acoes.map((acao) => (
        <Button
          key={acao.estado}
          variant={acao.variant}
          size="sm"
          disabled={pending}
          onClick={() => run(acao.estado)}
        >
          {acao.label}
        </Button>
      ))}
    </>
  )
}
