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

/** Intervalo de atualização da conversa aberta, para receber mensagens novas sem recarregar a página. */
const INTERVALO_ATUALIZACAO_MS = 15000

/** Função do interlocutor, mostrada por baixo do nome. */
function rotuloPapel(conversa: ConversaResumo): string {
  if (conversa.papel === 'cliente') {
    if (conversa.profissional_id) return 'Profissional'
    if (conversa.empresa_id) return 'Empresa'
    return 'Contacto'
  }
  return 'Cliente'
}

/** Iniciais para o avatar (sem imagens externas). */
function iniciais(nome: string): string {
  const letras = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
  return letras || '?'
}

function formatarHoraCurta(valor: string): string {
  return new Intl.DateTimeFormat('pt-AO', { hour: '2-digit', minute: '2-digit' }).format(new Date(valor))
}

/** Hora se for hoje; caso contrário, dia e mês. */
function formatarDataLista(valor: string): string {
  const data = new Date(valor)
  if (data.toDateString() === new Date().toDateString()) return formatarHoraCurta(valor)
  return new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: '2-digit' }).format(data)
}

export function MensagensPainel({ conversas: conversasIniciais, userId, basePath, conversaInicial }: Props) {
  const router = useRouter()
  const [conversas, setConversas] = React.useState<ConversaResumo[]>(conversasIniciais)
  const [selecionada, setSelecionada] = React.useState<string | null>(
    conversaInicial && conversasIniciais.some((c) => c.id === conversaInicial) ? conversaInicial : null
  )
  const [mensagens, setMensagens] = React.useState<MensagemConversa[]>([])
  const [texto, setTexto] = React.useState('')
  const [erro, setErro] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const fimRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setConversas(conversasIniciais)
  }, [conversasIniciais])

  const conversaAtual = conversas.find((c) => c.id === selecionada) ?? null

  const carregar = React.useCallback(async (conversaId: string) => {
    // Marcar como lidas é feito pelo destinatário; a RLS e a própria ação validam.
    await marcarMensagensLidas(conversaId)
    const resultado = await listarMensagens(conversaId)
    if (resultado.success) {
      setMensagens(resultado.data)
      setErro(null)
    } else {
      setErro(resultado.error)
    }
    setConversas((anteriores) =>
      anteriores.map((c) => (c.id === conversaId ? { ...c, nao_lidas: 0 } : c))
    )
  }, [])

  React.useEffect(() => {
    if (!selecionada) {
      setMensagens([])
      return
    }
    carregar(selecionada)
    const intervalo = window.setInterval(() => carregar(selecionada), INTERVALO_ATUALIZACAO_MS)
    return () => window.clearInterval(intervalo)
  }, [selecionada, carregar])

  React.useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens])

  function selecionar(id: string) {
    setSelecionada(id)
    setTexto('')
    setErro(null)
    router.replace(`${basePath}?conversa=${id}`, { scroll: false })
  }

  function voltarLista() {
    setSelecionada(null)
    router.replace(basePath, { scroll: false })
  }

  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selecionada) return
    const conteudo = texto.trim()
    if (!conteudo) return
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

  /** Enter envia; Shift+Enter quebra linha. */
  function teclar(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  if (conversas.length === 0) {
    return (
      <Card variant="liquid" padding="lg" className="text-center">
        <div className="space-y-2">
          <p className="font-semibold text-ink dark:text-cream">Ainda não tem conversas.</p>
          <p className="text-sm text-neutral-500 dark:text-cream-text/70">
            Procure profissionais, empresas ou serviços na plataforma e use “Contactar” para iniciar uma conversa.
          </p>
        </div>
      </Card>
    )
  }

  const painelBase = 'min-h-0 flex-col overflow-hidden rounded-2xl border border-card-border bg-white/70 dark:bg-neutral-800/70'

  return (
    <div className="grid grid-cols-1 gap-4 md:h-[640px] md:grid-cols-3">
      <aside className={`${selecionada ? 'hidden md:flex' : 'flex'} ${painelBase}`}>
        <h2 className="border-b border-card-border px-4 py-3 text-sm font-semibold text-ink dark:text-cream">
          Conversas
        </h2>
        <ul className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Lista de conversas">
          {conversas.map((conversa) => {
            const ativa = conversa.id === selecionada
            return (
              <li key={conversa.id}>
                <button
                  type="button"
                  onClick={() => selecionar(conversa.id)}
                  aria-current={ativa ? 'true' : undefined}
                  className={`flex min-h-[64px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    ativa ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-neutral-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  >
                    {iniciais(conversa.nome_interlocutor)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-ink dark:text-cream">{conversa.nome_interlocutor}</span>
                      {conversa.ultima_mensagem_em && (
                        <time dateTime={conversa.ultima_mensagem_em} className="shrink-0 text-xs text-neutral-500 dark:text-cream-text/70">
                          {formatarDataLista(conversa.ultima_mensagem_em)}
                        </time>
                      )}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-neutral-600 dark:text-cream-text/80">
                        {conversa.ultima_mensagem ?? 'Sem mensagens ainda'}
                      </span>
                      {conversa.nao_lidas > 0 && (
                        <span
                          aria-label={`${conversa.nao_lidas} mensagens não lidas`}
                          className="shrink-0 rounded-full bg-orange-500 px-2 text-xs font-bold leading-5 text-ink"
                        >
                          {conversa.nao_lidas}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <section
        aria-label="Conversa"
        className={`${selecionada ? 'flex' : 'hidden md:flex'} ${painelBase} md:col-span-2`}
      >
        {!conversaAtual ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-neutral-500 dark:text-cream-text/70">
            Selecione uma conversa para ler as mensagens.
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-card-border bg-white/90 px-3 py-3 dark:bg-neutral-800/90">
              <button
                type="button"
                onClick={voltarLista}
                aria-label="Voltar às conversas"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-xl text-ink hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:bg-white/10 md:hidden"
              >
                <span aria-hidden="true">←</span>
              </button>
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
              >
                {iniciais(conversaAtual.nome_interlocutor)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink dark:text-cream">{conversaAtual.nome_interlocutor}</p>
                <p className="text-xs text-neutral-500 dark:text-cream-text/70">{rotuloPapel(conversaAtual)}</p>
              </div>
            </header>

            <div
              className="min-h-[320px] flex-1 space-y-3 overflow-y-auto px-4 py-4"
              role="log"
              aria-live="polite"
              aria-label="Mensagens"
            >
              {mensagens.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 dark:text-cream-text/70">
                  Ainda não há mensagens. Escreva a primeira.
                </p>
              ) : (
                mensagens.map((mensagem) => {
                  const minha = mensagem.remetente_id === userId
                  return (
                    <div key={mensagem.id} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          minha
                            ? 'rounded-br-md bg-orange-500 text-ink'
                            : 'rounded-bl-md bg-neutral-100 text-ink dark:bg-neutral-700 dark:text-cream'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{mensagem.conteudo}</p>
                        <p className={`mt-1 text-[11px] ${minha ? 'text-ink/70' : 'text-neutral-500 dark:text-cream-text/70'}`}>
                          <time dateTime={mensagem.criada_em}>{formatarHoraCurta(mensagem.criada_em)}</time>
                          {minha ? (mensagem.lida_em ? ' · Lida' : ' · Enviada') : ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={fimRef} />
            </div>

            {erro && (
              <p role="alert" className="mx-4 mb-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {erro}
              </p>
            )}

            <form onSubmit={enviar} className="flex items-end gap-2 border-t border-card-border bg-white/90 p-3 dark:bg-neutral-800/90">
              <label htmlFor="mensagem-nova" className="sr-only">
                Escrever mensagem
              </label>
              <textarea
                id="mensagem-nova"
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                onKeyDown={teclar}
                rows={1}
                maxLength={4000}
                placeholder="Escreva uma mensagem"
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-card-border bg-white px-4 py-2.5 text-sm text-ink shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              />
              <Button type="submit" disabled={pending || texto.trim().length === 0} className="min-h-[44px] shrink-0">
                {pending ? 'A enviar…' : 'Enviar'}
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
