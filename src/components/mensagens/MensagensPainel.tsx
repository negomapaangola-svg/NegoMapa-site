'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  ConversaResumo,
  MensagemConversa,
  enviarMensagem,
  listarMensagens,
  marcarMensagensLidas,
} from '@/lib/actions/conversas'

type Props = {
  conversas: ConversaResumo[]
  userId: string
  /** Caminho base da página, para sincronizar a conversa selecionada no URL. */
  basePath: string
  conversaInicial?: string | null
}

/**
 * Rótulo do interlocutor, calculado pelo papel do utilizador nesta conversa:
 * - como cliente, o interlocutor é o profissional ou a empresa;
 * - como profissional ou empresa, o interlocutor é o cliente.
 */
function rotuloConversa(conversa: ConversaResumo): string {
  if (conversa.papel === 'cliente') {
    return conversa.profissional_id ? 'Profissional' : 'Empresa'
  }
  return 'Cliente'
}

function formatarHora(valor: string): string {
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(valor))
}

export function MensagensPainel({ conversas, userId, basePath, conversaInicial }: Props) {
  const router = useRouter()
  const [selecionada, setSelecionada] = React.useState<string | null>(
    conversaInicial && conversas.some((c) => c.id === conversaInicial) ? conversaInicial : null
  )
  const [mensagens, setMensagens] = React.useState<MensagemConversa[]>([])
  const [texto, setTexto] = React.useState('')
  const [erro, setErro] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  const carregar = React.useCallback(async (conversaId: string) => {
    await marcarMensagensLidas(conversaId)
    const resultado = await listarMensagens(conversaId)
    if (resultado.success) {
      setMensagens(resultado.data)
      setErro(null)
    } else {
      setErro(resultado.error)
    }
  }, [])

  React.useEffect(() => {
    if (!selecionada) {
      setMensagens([])
      return
    }
    carregar(selecionada)
  }, [selecionada, carregar])

  function selecionar(id: string) {
    setSelecionada(id)
    setTexto('')
    router.replace(`${basePath}?conversa=${id}`)
  }

  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selecionada) return
    const conteudo = texto
    startTransition(async () => {
      const resultado = await enviarMensagem(selecionada, conteudo)
      if (resultado.success) {
        setTexto('')
        await carregar(selecionada)
      } else {
        setErro(resultado.error ?? 'Não foi possível enviar a mensagem.')
      }
    })
  }

  if (conversas.length === 0) {
    return (
      <Card variant="liquid" padding="lg" className="text-center">
        <p className="text-neutral-600 dark:text-cream-text/80">Ainda não tem conversas.</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ul className="space-y-2" aria-label="Conversas">
        {conversas.map((conversa) => (
          <li key={conversa.id}>
            <button
              type="button"
              onClick={() => selecionar(conversa.id)}
              aria-current={selecionada === conversa.id ? 'true' : undefined}
              className={`w-full text-left px-4 py-3 rounded-[4px] border border-card-border transition-colors ${
                selecionada === conversa.id
                  ? 'bg-orange-50 dark:bg-orange-900/20'
                  : 'bg-white/50 dark:bg-neutral-800/50 hover:border-orange-500'
              }`}
            >
              <span className="block font-medium text-ink dark:text-cream">
                {rotuloConversa(conversa)}
              </span>
              <span className="block text-xs text-neutral-500 dark:text-cream-text/70">
                Iniciada em {formatarHora(conversa.criada_em)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="md:col-span-2">
        {!selecionada ? (
          <p className="text-neutral-500 dark:text-cream-text/70">Selecione uma conversa para ler as mensagens.</p>
        ) : (
          <div className="space-y-4">
            {erro && (
              <div role="alert" className="px-4 py-3 rounded-[4px] border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                {erro}
              </div>
            )}

            <div className="space-y-3 max-h-[480px] overflow-y-auto p-4 rounded-[4px] border border-card-border bg-white/50 dark:bg-neutral-800/50">
              {mensagens.length === 0 ? (
                <p className="text-neutral-500 dark:text-cream-text/70">Ainda não há mensagens nesta conversa.</p>
              ) : (
                mensagens.map((mensagem) => {
                  const minha = mensagem.remetente_id === userId
                  return (
                    <div key={mensagem.id} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-[4px] text-sm whitespace-pre-wrap ${
                          minha
                            ? 'bg-orange-100 text-ink dark:bg-orange-900/30 dark:text-cream'
                            : 'bg-neutral-100 text-ink dark:bg-neutral-700 dark:text-cream'
                        }`}
                      >
                        <p>{mensagem.conteudo}</p>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-cream-text/70">
                          {formatarHora(mensagem.criada_em)}
                          {minha && mensagem.lida_em ? ' · Lida' : ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form onSubmit={enviar} className="space-y-3">
              <label htmlFor="mensagem-nova" className="block text-sm font-medium text-ink dark:text-cream">
                Escrever mensagem
              </label>
              <textarea
                id="mensagem-nova"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={3}
                maxLength={4000}
                className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              />
              <Button type="submit" disabled={pending || texto.trim().length === 0}>
                {pending ? 'A enviar…' : 'Enviar'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
