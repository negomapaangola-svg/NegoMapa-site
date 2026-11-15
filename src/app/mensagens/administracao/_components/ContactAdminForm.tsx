'use client'

import * as React from 'react'
import { sendMessageToAdmin } from '@/lib/actions/admin-foundation'

export function ContactAdminForm() {
  const [subject, setSubject] = React.useState('')
  const [body, setBody] = React.useState('')
  const [feedback, setFeedback] = React.useState('')
  const [pending, startTransition] = React.useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await sendMessageToAdmin(subject, body)
      setFeedback(result.success ? 'Mensagem enviada à administração.' : result.error || 'Não foi possível enviar.')
      if (result.success) {
        setSubject('')
        setBody('')
      }
    })
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <div>
        <label htmlFor="admin-subject" className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-100">Assunto</label>
        <input
          id="admin-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          minLength={3}
          maxLength={160}
          required
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <div>
        <label htmlFor="admin-body" className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-100">Mensagem</label>
        <textarea
          id="admin-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          maxLength={5000}
          required
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <button
        type="submit"
        disabled={pending || subject.trim().length < 3 || !body.trim()}
        className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
      >
        Enviar à administração
      </button>
      {feedback ? <p role="status" className="text-sm text-neutral-600 dark:text-neutral-300">{feedback}</p> : null}
    </form>
  )
}
