'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Notificacao, marcarNotificacaoLida, marcarTodasLidas } from '@/lib/actions/notificacoes'
import { formatDate } from '@/lib/utils'

type Props = {
  notificacoes: Notificacao[]
}

function obterDestino(notificacao: Notificacao): string | null {
  switch (notificacao.tipo) {
    case 'candidatura_nova':
      return '/empresa/painel/candidaturas'
    case 'candidatura_estado':
      return '/candidaturas'
    case 'vaga_aprovada':
    case 'vaga_rejeitada':
      return '/empresa/painel/vagas'
    case 'empresa_aprovada':
      return '/empresa/painel'
    case 'empresa_rejeitada':
      return '/cadastrar-empresa'
    default:
      return null
  }
}

export function NotificacoesLista({ notificacoes }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [erro, setErro] = React.useState<string | null>(null)

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  function marcarUma(id: string) {
    setErro(null)
    startTransition(async () => {
      const resultado = await marcarNotificacaoLida(id)
      if (!resultado.success) setErro(resultado.error ?? 'Ocorreu um erro.')
      router.refresh()
    })
  }

  function marcarTodas() {
    setErro(null)
    startTransition(async () => {
      const resultado = await marcarTodasLidas()
      if (!resultado.success) setErro(resultado.error ?? 'Ocorreu um erro.')
      router.refresh()
    })
  }

  function aoClicarCartao(notificacao: Notificacao) {
    if (!notificacao.lida) {
      marcarUma(notificacao.id)
    }
  }

  function aoTeclarCartao(evento: React.KeyboardEvent, notificacao: Notificacao) {
    if (!notificacao.lida && (evento.key === 'Enter' || evento.key === ' ')) {
      evento.preventDefault()
      marcarUma(notificacao.id)
    }
  }

  if (notificacoes.length === 0) {
    return <p className="text-neutral-500 dark:text-cream-text/70">Não tem notificações.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-cream-text/80">
          Não lidas: <span className="font-medium text-ink dark:text-cream">{naoLidas}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/preferencias-notificacoes">Preferências</Link>
          </Button>
          <Button variant="outline" size="sm" disabled={pending || naoLidas === 0} onClick={marcarTodas}>
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      {erro && (
        <div role="alert" className="px-4 py-3 rounded-[4px] border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
          {erro}
        </div>
      )}

      {notificacoes.map((notificacao) => {
        const destino = obterDestino(notificacao)

        return (
          <div
            key={notificacao.id}
            role={notificacao.lida ? undefined : 'button'}
            tabIndex={notificacao.lida ? undefined : 0}
            onClick={() => aoClicarCartao(notificacao)}
            onKeyDown={(evento) => aoTeclarCartao(evento, notificacao)}
            className={`p-4 rounded-[4px] border border-card-border space-y-2 ${
              notificacao.lida
                ? 'bg-white/30 dark:bg-neutral-800/30'
                : 'bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:border-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className={`font-medium ${notificacao.lida ? 'text-neutral-700 dark:text-cream-text' : 'text-ink dark:text-cream'}`}>
                {notificacao.titulo}
              </p>
              <span className="text-xs text-neutral-500 dark:text-cream-text/70">
                {formatDate(notificacao.criada_em)}
              </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-cream-text/80 whitespace-pre-wrap">{notificacao.corpo}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!notificacao.lida && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={(evento) => {
                    evento.stopPropagation()
                    marcarUma(notificacao.id)
                  }}
                >
                  Marcar como lida
                </Button>
              )}

              {destino && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(evento) => evento.stopPropagation()}
                  asChild
                >
                  <Link href={destino}>Abrir</Link>
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
