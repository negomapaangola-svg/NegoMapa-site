import type { ReactNode } from 'react'
type DashboardMetricProps = { label: string; value: string | number; detail?: ReactNode }
export function DashboardMetric({ label, value, detail }: DashboardMetricProps) {
  return <div className="min-w-0 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/80">
    <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</dt>
    <dd className="mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-cream">{value}</dd>
    {detail ? <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{detail}</div> : null}
  </div>
}