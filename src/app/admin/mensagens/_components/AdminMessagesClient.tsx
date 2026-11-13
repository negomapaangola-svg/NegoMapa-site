'use client'

import * as React from 'react'
import {
  archiveAdminMessage,
  getAdminMessages,
  markAdminMessageRead,
  replyToAdminMessage,
  type AdminMessage,
  type AdminMessageFilter,
} from '@/lib/actions/admin-foundation'

type Props = { initialMessages: AdminMessage[] }

const FILTERS: Array<{ value: AdminMessageFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'Não lidas' },
  { value: 'read', label: 'Lidas' },
  { value: 'archived', label: 'Arquivadas' },
]

export function AdminMessagesClient({ initialMessages }: Props) {
  const [messages, setMessages] = React.useState(initialMessages)
  const [filter, setFilter] = React.useState<AdminMessageFilter>('all')
  const [replies, setReplies] = React.useState<Record<string, string>>({})
  const [feedback, setFeedback] = React.useState('')
  const [pending, startTransition] = React.useTransition()

  function refresh(nextFilter: AdminMessageFilter) {
    setFilter(nextFilter)
    startTransition(async () => {
      const result = await getAdminMessages(nextFilter)
      if (result) setMessages(result)
      else setFeedback('Não foi possível carregar a caixa de entrada.')
    })
  }

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action()
      setFeedback(result.success ? 'Alteração guardada.' : result.error || 'Não foi possível concluir a operação.')
      const updated = await getAdminMessages(filter)
      if (updated) setMessages(updated)
    })
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" aria-label="Filtrar mensagens">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => refresh(item.value)}
            aria-pressed={filter === item.value}
            className={`rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 ${filter === item.value ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {feedback ? <p className="text-sm text-neutral-600 dark:text-neutral-300" role="status">{feedback}</p> : null}

      {messages.length === 0 ? (
        <p className="rounded-lg bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
          Não existem mensagens neste filtro.
        </p>
      ) : (
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {messages.map((message) => (
            <article key={message.id} className="py-5 first:pt-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{message.subject}</p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {message.sender_name} · {new Date(message.created_at).toLocaleString('pt-PT')}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700 dark:text-neutral-300">{message.body}</p>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {message.archived_at ? 'Arquivada' : message.read_at ? 'Lida' : 'Não lida'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!message.read_at && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => markAdminMessageRead(message.id))}
                      className="rounded-md px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      Marcar lida
                    </button>
                  )}
                  {!message.archived_at && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => archiveAdminMessage(message.id))}
                      className="rounded-md px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      Arquivar
                    </button>
                  )}
                </div>
              </div>

              {!message.archived_at && (
                <form
                  className="mt-4 max-w-3xl space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const body = replies[message.id] || ''
                    if (!body.trim()) return
                    run(async () => {
                      const result = await replyToAdminMessage(message.id, body)
                      if (result.success) setReplies((current) => ({ ...current, [message.id]: '' }))
                      return result
                    })
                  }}
                >
                  <label htmlFor={`reply-${message.id}`} className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">Responder</label>
                  <textarea
                    id={`reply-${message.id}`}
                    value={replies[message.id] || ''}
                    onChange={(event) => setReplies((current) => ({ ...current, [message.id]: event.target.value }))}
                    rows={3}
                    maxLength={5000}
                    placeholder="Escreva uma resposta..."
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="submit"
                    disabled={pending || !(replies[message.id] || '').trim()}
                    className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
                  >
                    Enviar resposta
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
