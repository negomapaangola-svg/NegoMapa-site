import type { FormErrors, StepDefinition } from './types'

export const REQUIRED_MESSAGE = 'Este campo é obrigatório.'

/** Considera vazio: undefined, null, string em branco, lista vazia ou false. */
export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'boolean') return value === false
  return false
}

/** Valida apenas os campos obrigatórios da etapa indicada. */
export function validateStep<T>(step: StepDefinition<T>, data: T): FormErrors {
  const errors: FormErrors = {}
  for (const field of step.requiredFields) {
    const value = (data as Record<string, unknown>)[field]
    if (isEmptyValue(value)) {
      errors[field] = REQUIRED_MESSAGE
    }
  }
  return errors
}
