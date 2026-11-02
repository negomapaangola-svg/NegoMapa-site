'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { enviarContacto } from '@/lib/actions/contacto'

const campo =
  'w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream'

export function FormularioContacto() {
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setFeedback(null)

    startTransition(async () => {
      const resultado = await enviarContacto(formData)
      if (resultado.success) {
        setFeedback({
          tipo: 'sucesso',
          texto: 'Mensagem enviada. A equipa da NegóMapa responderá o mais brevemente possível.',
        })
        formRef.current?.reset()
      } else {
        setFeedback({ tipo: 'erro', texto: resultado.error ?? 'Ocorreu um erro. Tente novamente.' })
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Campo de isco: oculto para pessoas, preenchido só por robôs */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="contacto-nome" className="block text-sm font-medium text-ink dark:text-cream mb-1">
          Nome <span aria-hidden="true">*</span>
        </label>
        <input id="contacto-nome" name="nome" type="text" required maxLength={120} autoComplete="name" className={campo} />
      </div>

      <div>
        <label htmlFor="contacto-email" className="block text-sm font-medium text-ink dark:text-cream mb-1">
          Correio eletrónico <span aria-hidden="true">*</span>
        </label>
        <input id="contacto-email" name="email" type="email" required maxLength={254} autoComplete="email" className={campo} />
      </div>

      <div>
        <label htmlFor="contacto-telefone" className="block text-sm font-medium text-ink dark:text-cream mb-1">
          Telefone <span className="text-neutral-500 dark:text-cream-text/70">(opcional)</span>
        </label>
        <input id="contacto-telefone" name="telefone" type="tel" maxLength={30} autoComplete="tel" className={campo} />
      </div>

      <div>
        <label htmlFor="contacto-mensagem" className="block text-sm font-medium text-ink dark:text-cream mb-1">
          Mensagem <span aria-hidden="true">*</span>
        </label>
        <textarea id="contacto-mensagem" name="mensagem" required rows={6} maxLength={2000} className={campo} />
        <p className="mt-1 text-xs text-neutral-500 dark:text-cream-text/70">Entre 10 e 2000 caracteres.</p>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={
            feedback.tipo === 'sucesso'
              ? 'px-4 py-3 rounded-[4px] border border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
              : 'px-4 py-3 rounded-[4px] border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
          }
        >
          {feedback.texto}
        </div>
      )}

      <Button type="submit" variant="liquid" size="lg" disabled={pending}>
        {pending ? 'A enviar…' : 'Enviar mensagem'}
      </Button>
    </form>
  )
}
