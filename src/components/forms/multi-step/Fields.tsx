'use client'

import { cn } from '@/lib/utils'
import { FieldShell } from './FormFields'

export interface OpcaoSelect {
  value: string
  label: string
}

const controlo =
  'w-full rounded-[4px] border bg-white px-4 py-3 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-neutral-900 dark:text-neutral-50 disabled:opacity-60'

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<string> | ReadonlyArray<OpcaoSelect>
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

/** Lista de seleção. Aceita lista de textos ou de {value, label}. */
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  required = false,
  disabled = false,
  error,
  hint,
}: SelectFieldProps) {
  const lista: OpcaoSelect[] = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-required={required}
        aria-invalid={Boolean(error)}
        className={cn(controlo, error ? 'border-red-600' : 'border-card-border dark:border-neutral-700')}
      >
        <option value="">{placeholder}</option>
        {lista.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

interface RadioGroupFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<OpcaoSelect>
  required?: boolean
  error?: string
}

/** Escolha única apresentada como botões de rádio (ex.: Sim / Não). */
export function RadioGroupField({ id, label, value, onChange, options, required = false, error }: RadioGroupFieldProps) {
  return (
    <fieldset className="flex flex-col gap-3" aria-invalid={Boolean(error)}>
      <legend className="font-heading text-base font-bold text-neutral-900 dark:text-neutral-50">
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </legend>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-[4px] border px-4 py-3 text-base',
              value === o.value ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-card-border dark:border-neutral-700'
            )}
          >
            <input
              type="radio"
              name={id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              required={required}
              className="h-5 w-5 accent-orange-500"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-erro`} role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  )
}

interface FileFieldProps {
  id: string
  label: string
  file: File | null
  onChange: (file: File | null) => void
  accept: string
  required?: boolean
  error?: string
  hint?: string
}

/** Escolha de ficheiro. Guarda o File; o upload é feito no envio. */
export function FileField({ id, label, file, onChange, accept, required = false, error, hint }: FileFieldProps) {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        name={id}
        type="file"
        accept={accept}
        required={required && !file}
        aria-required={required}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="w-full rounded-[4px] border border-dashed border-card-border bg-white px-4 py-3 text-base dark:border-neutral-700 dark:bg-neutral-900"
      />
      {file && <p className="text-sm text-neutral-600 dark:text-neutral-400">Selecionado: {file.name}</p>}
    </FieldShell>
  )
}
