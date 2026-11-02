'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { criarCandidatura } from '@/lib/actions/candidaturas'

type Props = {
  vagaId: string
}

const campo =
  'w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream'

export function CandidaturaForm({ vagaId }: Props) {
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)

  function submeter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      const resultado = await criarCandidatura(vagaId, formData)
      if (resultado.success) {
        setFeedback({ tipo: 'sucesso', texto: 'Candidatura enviada. Pode acompanhá-la em As Minhas Candidaturas.' })
        formRef.current?.reset()
      } else {
        setFeedback({ tipo: 'erro', texto: resultado.error ?? 'Não foi possível enviar a candidatura.' })
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={submeter} className="space-y-5" aria-labelledby="candidatura-titulo">
      <div>
        <label htmlFor="candidatura-nome" className="block text-sm font-medium text-ink dark:text-cream mb-1">
          Nome do candidato <span aria-hidden="true">*</span>
        </label>
        <input id="candidatura-nome" name="nome_candidato" type="text" required minLength={3} maxLength={120} className={campo} />
      </div>

      <div>
        <label htmlFor="candidatura-mensagem" className="block text-sm font-medium text-ink dark:text-cream mb-1">
          Mensagem <span aria-hidden="true">*</span>
        </label>
        <textarea id="candidatura-mensagem" name="mensagem" required minLength={10} maxLength={2000} rows={5} className={campo} />
      </div>

      <div>
        <label htmlFor="candidatura-cv" className="block text-sm font-medium text-ink dark:text-cream mb-1">
          Link do CV <span className="text-neutral-500 dark:text-cream-text/70">(opcional, https://)</span>
        </label>
        <input id="candidatura-cv" name="cv_url" type="url" maxLength={500} placeholder="https://" className={campo} />
      </div>

      {feedback && (
        <div role={feedback.tipo === 'erro' ? 'alert' : 'status'} aria-live="polite" className={feedback.tipo === 'sucesso'
          ? 'px-4 py-3 rounded-[4px] border border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
          : 'px-4 py-3 rounded-[4px] border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}>
          {feedback.texto}
          {feedback.tipo === 'sucesso' && (
            <>
              {' '}
              <Link href="/candidaturas" className="underline">Ver candidaturas</Link>
            </>
          )}
        </div>
      )}

      <Button type="submit" variant="liquid" size="lg" disabled={pending}>
        {pending ? 'A enviar…' : 'Enviar candidatura'}
      </Button>
    </form>
  )
}
