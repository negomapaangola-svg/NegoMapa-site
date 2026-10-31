'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

/** Invólucro comum: rótulo, asterisco de obrigatório, dica e erro. */
export function FieldShell({ id, label, required, error, hint, children }: FieldShellProps) {
  const errorId = `${id}-erro`
  const hintId = `${id}-dica`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-heading text-base font-bold text-neutral-900 dark:text-neutral-50">
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-neutral-500 dark:text-neutral-400">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
  hint?: string
  type?: 'text' | 'email' | 'tel'
  placeholder?: string
  autoComplete?: string
}

/** Campo de texto pronto a usar, com rótulo, obrigatório e erro. */
export function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  error,
  hint,
  type = 'text',
  placeholder,
  autoComplete,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={[hint ? `${id}-dica` : null, error ? `${id}-erro` : null].filter(Boolean).join(' ') || undefined}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          'w-full rounded-[4px] border bg-white px-4 py-3 text-base text-neutral-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
          'dark:bg-neutral-900 dark:text-neutral-50',
          error ? 'border-red-600' : 'border-card-border dark:border-neutral-700'
        )}
      />
    </FieldShell>
  )
}

interface CheckboxFieldProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  required?: boolean
  error?: string
}

/** Caixa de seleção. Para obrigatória, é preciso estar marcada. */
export function CheckboxField({ id, label, checked, onChange, required = false, error }: CheckboxFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-start gap-3 text-base text-neutral-900 dark:text-neutral-50">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          className="mt-1 h-5 w-5 accent-orange-500"
        />
        <span>
          {label}
          {required && (
            <span className="ml-1 text-red-600" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (obrigatório)</span>}
        </span>
      </label>
      {error && (
        <p id={`${id}-erro`} role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
