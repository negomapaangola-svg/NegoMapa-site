'use client'

import { useMemo, useState } from 'react'
import type { AdminActivityMetricId, AdminActivitySeries, AdminActivityPoint } from '@/lib/actions/admin-foundation'

const METRICS: Array<{ id: AdminActivityMetricId; label: string }> = [
  { id: 'accounts', label: 'Novas contas' },
  { id: 'professionals', label: 'Novos profissionais' },
  { id: 'companies', label: 'Novas empresas' },
  { id: 'services', label: 'Novos serviços' },
  { id: 'products', label: 'Novos produtos' },
  { id: 'vacancies', label: 'Novas vagas' },
  { id: 'applications', label: 'Novas candidaturas' },
  { id: 'requests', label: 'Novos pedidos' },
  { id: 'messages', label: 'Novas mensagens' },
  { id: 'alerts', label: 'Novas denúncias' },
]

const PERIODS = [7, 30, 90] as const

function formatValue(value: number) {
  return new Intl.NumberFormat('pt-AO').format(value)
}

function formatDate(value: string, compact = false) {
  return new Intl.DateTimeFormat('pt-AO', compact
    ? { day: '2-digit', month: 'short', timeZone: 'UTC' }
    : { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }
  ).format(new Date(value + 'T00:00:00Z'))
}

function buildLine(points: AdminActivityPoint[]) {
  if (!points.length) return ''
  const max = Math.max(1, ...points.map((point) => point.value))
  const left = 48
  const right = 704
  const top = 18
  const bottom = 166
  return points.map((point, index) => {
    const x = left + (index / Math.max(1, points.length - 1)) * (right - left)
    const y = bottom - (point.value / max) * (bottom - top)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

export function AdminActivityCharts({ series }: { series: AdminActivitySeries }) {
  const [metric, setMetric] = useState<AdminActivityMetricId>('accounts')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30)

  const selected = METRICS.find((item) => item.id === metric) ?? METRICS[0]
  const points = useMemo(() => (series[metric] ?? []).slice(-period), [series, metric, period])
  const hasData = points.length > 0
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const peak = points.reduce((max, point) => Math.max(max, point.value), 0)
  const line = hasData ? buildLine(points) : ''
  const first = points[0]
  const middle = points[Math.floor((points.length - 1) / 2)]
  const last = points[points.length - 1]

  return (
    <section className="space-y-4" aria-labelledby="admin-activity-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="admin-activity-title" className="text-lg font-bold text-slate-900 dark:text-white">Evolução da actividade</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Registos reais agrupados por dia. Sem estimativas nem dados simulados.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Período do gráfico">
          {PERIODS.map((days) => (
            <button key={days} type="button" onClick={() => setPeriod(days)} aria-pressed={period === days}
              className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${period === days ? 'bg-orange-700 text-white dark:bg-orange-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}>
              {days} dias
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Métrica a consultar">
        {METRICS.map((item) => (
          <button key={item.id} type="button" onClick={() => setMetric(item.id)} aria-pressed={metric === item.id}
            className={`min-h-9 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${metric === item.id ? 'border-orange-700 bg-orange-50 text-orange-900 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-200' : 'border-transparent bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{selected.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{series[metric] === null ? '—' : formatValue(total)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total no período · pico diário: {series[metric] === null ? '—' : formatValue(peak)}</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{first && last ? `${formatDate(first.date, true)} — ${formatDate(last.date, true)}` : `Últimos ${period} dias`}</p>
        </div>

        {series[metric] === null || !hasData ? (
          <div className="flex min-h-52 items-center justify-center rounded-lg bg-slate-50 px-4 text-center text-sm text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
            Sem dados disponíveis
          </div>
        ) : (
          <div className="w-full">
            <svg viewBox="0 0 720 218" role="img" aria-label={`Gráfico de linha: ${selected.label} nos últimos ${period} dias`} className="h-auto w-full overflow-visible">
              {[18, 67, 116, 166].map((y, index) => (
                <g key={y}>
                  <line x1="48" x2="704" y1={y} y2={y} stroke="currentColor" opacity="0.12" strokeDasharray="3 5" />
                  <text x="38" y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">{formatValue(Math.round(peak * (3 - index) / 3))}</text>
                </g>
              ))}
              <polyline points={line} fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {points.map((point, index) => {
                if (period === 90 && index % 9 !== 0 && index !== points.length - 1) return null
                if (period === 30 && index % 5 !== 0 && index !== points.length - 1) return null
                const x = 48 + (index / Math.max(1, points.length - 1)) * 656
                const y = 166 - (point.value / Math.max(1, peak)) * 148
                return <circle key={point.date} cx={x} cy={y} r="3.5" fill="#F97316" stroke="currentColor" strokeWidth="1" />
              })}
              <text x="48" y="202" fontSize="11" fill="currentColor" opacity="0.7">{first ? formatDate(first.date, true) : ''}</text>
              <text x="376" y="202" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">{middle ? formatDate(middle.date, true) : ''}</text>
              <text x="704" y="202" textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">{last ? formatDate(last.date, true) : ''}</text>
            </svg>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">A série de novas contas permanece indisponível: as permissões actuais só permitem consultar o próprio perfil. Não são abertas permissões administrativas adicionais nesta tarefa.</p>
    </section>
  )
}
