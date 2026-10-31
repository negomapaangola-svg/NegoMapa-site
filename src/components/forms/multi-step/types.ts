import type { ReactNode } from 'react'

/** Erros por nome de campo. Só entram os campos com erro. */
export type FormErrors = Partial<Record<string, string>>

export interface StepRenderProps<T> {
  data: T
  errors: FormErrors
  setField: <K extends keyof T>(key: K, value: T[K]) => void
}

export interface StepDefinition<T> {
  /** Identificador estável da etapa (ex.: "dados-basicos"). */
  id: string
  /** Título mostrado no topo da etapa. */
  title: string
  /** Texto de apoio opcional. */
  description?: string
  /**
   * Campos obrigatórios desta etapa. "Continuar" valida apenas estes.
   * Campos de outras etapas não são validados aqui.
   */
  requiredFields: ReadonlyArray<string>
  /** Conteúdo da etapa. Os dados vêm sempre do estado do formulário. */
  render: (props: StepRenderProps<T>) => ReactNode
}
