'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { FormErrors, StepDefinition } from './types'
import { validateStep } from './validation'

export interface MultiStepFormProps<T> {
  steps: ReadonlyArray<StepDefinition<T>>
  initialData: T
  onSubmit: (data: T) => void | Promise<void>
  submitLabel?: string
  submitting?: boolean
}

/**
 * Formulário multi-etapas genérico.
 * - Os dados vivem num único estado, por isso "Voltar" nunca os perde.
 * - "Continuar" valida só os campos obrigatórios da etapa atual.
 * - A última etapa mostra o botão de submissão (submitLabel).
 */
export function MultiStepForm<T extends object>({
  steps,
  initialData,
  onSubmit,
  submitLabel = 'Concluir',
  submitting = false,
}: MultiStepFormProps<T>) {
  const [data, setData] = useState<T>(initialData)
  const [index, setIndex] = useState(0)
  const [errors, setErrors] = useState<FormErrors>({})
  const headingRef = useRef<HTMLHeadingElement>(null)

  const total = steps.length
  const step = steps[index]
  const isFirst = index === 0
  const isLast = index === total - 1

  // Ao mudar de etapa, leva o foco ao título para leitores de ecrã e teclado.
  useEffect(() => {
    headingRef.current?.focus()
  }, [index])

  function setField<K extends keyof T>(key: K, value: T[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key as string]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }

  async function handleContinue(e?: FormEvent) {
    e?.preventDefault()
    const stepErrors = validateStep(step, data)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    if (isLast) {
      await onSubmit(data)
      return
    }
    setIndex((i) => Math.min(i + 1, total - 1))
  }

  function handleBack() {
    setErrors({})
    setIndex((i) => Math.max(i - 1, 0))
  }

  const progressPercent = Math.round(((index + 1) / total) * 100)
  const errorCount = Object.keys(errors).length

  return (
    <Card padding="lg" className="w-full max-w-2xl mx-auto">
      {/* Barra de progresso no topo */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          <span>
            Etapa {index + 1} de {total}
          </span>
          <span aria-hidden="true">{progressPercent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`Etapa ${index + 1} de ${total}`}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        >
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleContinue} noValidate className="flex flex-col gap-6">
        <header>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-2xl font-bold text-neutral-900 outline-none dark:text-neutral-50"
          >
            {step.title}
          </h2>
          {step.description && (
            <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">{step.description}</p>
          )}
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Os campos marcados com <span className="text-red-600">*</span> são obrigatórios.
          </p>
        </header>

        {errorCount > 0 && (
          <div role="alert" className="rounded-[4px] border border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950/30">
            Corrija os {errorCount} {errorCount === 1 ? 'campo' : 'campos'} assinalado{errorCount === 1 ? '' : 's'} antes de continuar.
          </div>
        )}

        <div className="flex flex-col gap-5">
          {step.render({ data, errors, setField })}
        </div>

        {/* Botões grandes: Voltar e Continuar */}
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            size="xl"
            onClick={handleBack}
            disabled={isFirst || submitting}
            className="w-full sm:w-auto"
          >
            Voltar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="xl"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            {isLast ? submitLabel : 'Continuar'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
