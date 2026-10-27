'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Option = { value: string; label: string }

type Props = {
  id: string
  label: string
  param: string
  value: string
  options: Option[]
}

export function FiltroSelect({ id, label, param, value, options }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(novoValor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (novoValor) params.set(param, novoValor)
    else params.delete(param)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-[4px] bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
