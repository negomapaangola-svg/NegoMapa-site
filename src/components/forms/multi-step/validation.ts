import type { FormErrors, StepDefinition } from './types'

export const REQUIRED_MESSAGE = 'Este campo é obrigatório.'

/** Considera vazio: undefined, null, string em branco, lista vazia ou false. */
export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'boolean') return value === false
  if (value instanceof File) return false
  return false
}

/** Campos obrigatórios desta etapa, já resolvidos para os dados atuais. */
export function camposObrigatorios<T>(step: StepDefinition<T>, data: T): ReadonlyArray<string> {
  return typeof step.requiredFields === 'function' ? step.requiredFields(data) : step.requiredFields
}

/** Valida apenas os campos obrigatórios da etapa indicada. */
export function validateStep<T>(step: StepDefinition<T>, data: T): FormErrors {
  const errors: FormErrors = {}
  for (const field of camposObrigatorios(step, data)) {
    const value = (data as Record<string, unknown>)[field]
    if (isEmptyValue(value)) {
      errors[field] = REQUIRED_MESSAGE
    }
  }
  return errors
}
